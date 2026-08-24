import { prisma } from '../../database/prisma.js';
import { ApiError } from '../../utils/errors.js';
import { firebaseAuth } from '../../firebase/admin.js';
import { createAuthUser, loadUser, type ResolvedUser } from '../../auth/user.js';

/**
 * Authentication service — backed by Firebase Authentication.
 *
 * Login, token refresh and email verification are handled by the Firebase Web
 * SDK on the client. The backend owns:
 *   - registration (so the correct RBAC role is assigned atomically)
 *   - resolving the current user's roles/permissions/memberships
 *   - issuing password-reset links via the Admin SDK
 */

export function publicUser(user: ResolvedUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt
  };
}

export async function register(input: {
  name: string;
  email: string;
  phone?: string;
  password: string;
  accountType: 'candidate' | 'employer' | 'shop-owner';
}) {
  const existing = await prisma.user.findFirst({ where: { email: input.email.toLowerCase() } });
  if (existing) throw new ApiError(409, 'User already exists');

  const roleSlug = input.accountType === 'employer' ? 'employer' : input.accountType === 'shop-owner' ? 'shop-owner' : 'candidate';

  const user = await createAuthUser({
    name: input.name,
    email: input.email,
    password: input.password,
    phone: input.phone,
    roleSlugs: [roleSlug],
    status: 'ACTIVE',
    createCandidateProfile: roleSlug === 'candidate'
  });

  return publicUser(user);
}

export async function currentUser(uid: string) {
  const user = await loadUser(uid);
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

export async function markLogin(uid: string) {
  await prisma.user.update({ where: { id: uid }, data: { lastLoginAt: new Date() } }).catch(() => undefined);
}

/**
 * Generate a Firebase password-reset link. Email delivery is handled by the
 * configured provider (Firebase's own templates, or a custom mailer). We never
 * reveal whether the account exists.
 */
export async function forgotPassword(email: string) {
  try {
    const link = await firebaseAuth().generatePasswordResetLink(email.toLowerCase());
    if (process.env.NODE_ENV !== 'production') console.info(`Password reset link for ${email}: ${link}`);
  } catch {
    /* swallow — do not reveal account existence */
  }
}
