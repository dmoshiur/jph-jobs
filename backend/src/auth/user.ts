/**
 * User provisioning + RBAC resolution against Firestore.
 *
 * Firestore user documents are keyed by the Firebase Auth `uid`, so verifying a
 * client ID token gives us the document id directly. Roles/permissions live in
 * Firestore (roles / user_roles / role_permissions / permissions) exactly as the
 * RBAC model requires.
 */
import { prisma } from '../database/prisma.js';
import { firebaseAuth } from '../firebase/admin.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ResolvedUser {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  status: string;
  roles: string[];
  permissions: string[];
  emailVerifiedAt?: Date | null;
}

const USER_INCLUDE = {
  roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } }
} as const;

function extractRbac(user: any): { roles: string[]; permissions: string[] } {
  const roles = (user.roles ?? []).map((ur: any) => ur.role?.slug).filter(Boolean) as string[];
  const permissions = [
    ...new Set(
      (user.roles ?? []).flatMap((ur: any) =>
        (ur.role?.permissions ?? []).map((rp: any) => rp.permission?.key).filter(Boolean)
      )
    )
  ] as string[];
  return { roles, permissions };
}

async function assignRole(userId: string, roleSlug: string) {
  const role = await prisma.role.findUnique({ where: { slug: roleSlug } });
  if (!role) return;
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId: role.id } },
    update: {},
    create: { userId, roleId: role.id }
  });
}

/**
 * Ensure a Firestore user document exists for a Firebase uid. Called from the
 * auth middleware so Google/email sign-ins that were created on the client are
 * transparently provisioned in the datastore on first API call.
 */
export async function ensureUserProvisioned(decoded: {
  uid: string;
  email?: string;
  name?: string;
  email_verified?: boolean;
  phone_number?: string;
}, defaultRole = 'candidate'): Promise<ResolvedUser | null> {
  let user = await prisma.user.findUnique({ where: { id: decoded.uid }, include: USER_INCLUDE });

  if (!user) {
    const email = (decoded.email ?? `${decoded.uid}@users.jphjobs.local`).toLowerCase();
    await prisma.user.create({
      data: {
        id: decoded.uid,
        name: decoded.name || email.split('@')[0],
        email,
        phone: decoded.phone_number ?? undefined,
        status: 'ACTIVE',
        emailVerifiedAt: decoded.email_verified ? new Date() : null
      }
    });
    await assignRole(decoded.uid, defaultRole);
    if (defaultRole === 'candidate') {
      await prisma.candidateProfile.upsert({
        where: { userId: decoded.uid },
        update: {},
        create: { userId: decoded.uid }
      });
    }
    user = await prisma.user.findUnique({ where: { id: decoded.uid }, include: USER_INCLUDE });
  }

  if (!user) return null;
  const { roles, permissions } = extractRbac(user);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    status: user.status,
    roles,
    permissions,
    emailVerifiedAt: user.emailVerifiedAt
  };
}

/** Load a fully-resolved user (roles + permissions) by uid, if present. */
export async function loadUser(uid: string): Promise<ResolvedUser | null> {
  const user = await prisma.user.findUnique({ where: { id: uid }, include: USER_INCLUDE });
  if (!user) return null;
  const { roles, permissions } = extractRbac(user);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    status: user.status,
    roles,
    permissions,
    emailVerifiedAt: user.emailVerifiedAt
  };
}

/**
 * Create a Firebase Auth user (email/password) and mirror it into Firestore with
 * the given roles. Used by registration and admin (super-admin) creation.
 */
export async function createAuthUser(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  roleSlugs: string[];
  status?: string;
  emailVerified?: boolean;
  createCandidateProfile?: boolean;
}): Promise<ResolvedUser> {
  const email = input.email.toLowerCase();
  const auth = firebaseAuth();

  let uid: string;
  try {
    const record = await auth.createUser({
      email,
      password: input.password,
      displayName: input.name,
      phoneNumber: input.phone && input.phone.startsWith('+') ? input.phone : undefined,
      emailVerified: input.emailVerified ?? false
    });
    uid = record.uid;
  } catch (err: any) {
    if (err?.code === 'auth/email-already-exists') {
      const existing = await auth.getUserByEmail(email);
      uid = existing.uid;
    } else {
      throw err;
    }
  }

  await prisma.user.upsert({
    where: { id: uid },
    update: { name: input.name, email, phone: input.phone, status: input.status ?? 'ACTIVE' },
    create: {
      id: uid,
      name: input.name,
      email,
      phone: input.phone,
      status: input.status ?? 'ACTIVE',
      emailVerifiedAt: input.emailVerified ? new Date() : null
    }
  });

  for (const slug of input.roleSlugs) await assignRole(uid, slug);
  if (input.createCandidateProfile) {
    await prisma.candidateProfile.upsert({ where: { userId: uid }, update: {}, create: { userId: uid } });
  }

  const resolved = await loadUser(uid);
  if (!resolved) throw new Error('Failed to load created user');
  return resolved;
}
