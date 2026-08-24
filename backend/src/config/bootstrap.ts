/**
 * Runtime bootstrap — runs once on server start.
 *
 * Guarantees the platform is usable immediately in any environment without a
 * separate seed step:
 *   - core roles (root-admin / candidate / employer / shop-owner / super-admin)
 *   - the full permission catalogue + role→permission grants
 *   - the root admin, created in Firebase Auth and mirrored into Firestore
 *
 * Full location/category/package seeding lives in database/seed.ts.
 * Safe to run repeatedly. Never crashes the server on failure.
 */
import { prisma } from '../database/prisma.js';
import { env, isFirebaseConfigured } from './env.js';
import { createAuthUser } from '../auth/user.js';

let bootstrapped: Promise<void> | null = null;

const PERMISSIONS = [
  'analytics.view',
  'users.view', 'users.edit',
  'jobs.view', 'jobs.create', 'jobs.edit', 'jobs.approve', 'jobs.delete',
  'companies.view', 'companies.create', 'companies.edit', 'companies.verify',
  'businesses.view', 'businesses.create', 'businesses.edit', 'businesses.verify',
  'applications.view', 'applications.create', 'applications.edit', 'applications.own',
  'candidates.view', 'candidates.edit',
  'packages.view', 'packages.edit',
  'payments.view', 'payments.refund',
  'advertisements.view', 'advertisements.edit',
  'categories.view', 'categories.edit',
  'locations.view', 'locations.edit',
  'skills.view', 'skills.edit',
  'reports.view', 'reports.edit',
  'reviews.view', 'reviews.edit',
  'notifications.view', 'notifications.edit',
  'cms.view', 'cms.edit',
  'settings.view', 'settings.edit',
  'admins.view', 'admins.create', 'admins.edit', 'admins.delete',
  'audit_logs.view'
];

const ROLE_GRANTS: Record<string, string[]> = {
  candidate: ['applications.create', 'applications.own', 'jobs.view', 'companies.view', 'businesses.view'],
  employer: ['jobs.create', 'jobs.edit', 'companies.create', 'companies.edit', 'applications.view', 'applications.edit', 'businesses.create', 'businesses.edit', 'packages.view', 'payments.view'],
  'shop-owner': ['jobs.create', 'jobs.edit', 'companies.create', 'companies.edit', 'applications.view', 'applications.edit', 'businesses.create', 'businesses.edit', 'packages.view', 'payments.view'],
  'super-admin': PERMISSIONS.filter((p) => p !== 'admins.delete'),
  'root-admin': PERMISSIONS
};

async function upsertRole(slug: string, permKeys: string[]) {
  const name = slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
  const role = await prisma.role.upsert({
    where: { slug },
    update: { description: `${slug} role` },
    create: { name, slug, system: true, description: `${slug} role` }
  });
  for (const key of permKeys) {
    const perm = await prisma.permission.findUnique({ where: { key } });
    if (!perm) continue;
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
      update: {},
      create: { roleId: role.id, permissionId: perm.id }
    });
  }
  return role;
}

export function bootstrap() {
  if (bootstrapped) return bootstrapped;
  bootstrapped = (async () => {
    if (!isFirebaseConfigured) {
      console.warn('Bootstrap skipped: Firebase is not configured yet.');
      return;
    }

    // Permissions
    for (const key of PERMISSIONS) {
      await prisma.permission.upsert({ where: { key }, update: { description: key }, create: { key, description: key } });
    }
    // Roles + grants
    for (const [slug, perms] of Object.entries(ROLE_GRANTS)) {
      await upsertRole(slug, perms);
    }

    // Root admin (Firebase Auth + Firestore mirror)
    const existing = await prisma.user.findFirst({ where: { email: env.ROOT_ADMIN_EMAIL.toLowerCase() } });
    if (!existing) {
      await createAuthUser({
        name: 'Root Admin',
        email: env.ROOT_ADMIN_EMAIL,
        password: env.ROOT_ADMIN_PASSWORD,
        roleSlugs: ['root-admin'],
        status: 'ACTIVE',
        emailVerified: true
      });
    }
  })().catch((error) => {
    console.error('Bootstrap failed (continuing):', error instanceof Error ? error.message : error);
  });
  return bootstrapped;
}
