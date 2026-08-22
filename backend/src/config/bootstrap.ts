/**
 * Runtime bootstrap — runs once on server start.
 *
 * Guarantees the platform is usable immediately in any environment (including
 * fresh Vercel deployments) without requiring `npm run seed` first:
 *   - root role + root admin from ROOT_ADMIN_EMAIL / ROOT_ADMIN_PASSWORD
 *   - candidate & employer roles
 *
 * Full demo/location/category seeding lives in database/seed.ts.
 * Safe to run repeatedly.
 */
import bcrypt from 'bcryptjs';
import { prisma } from '../database/prisma.js';
import { env } from './env.js';

let bootstrapped: Promise<void> | null = null;

export function bootstrap() {
  if (bootstrapped) return bootstrapped;
  bootstrapped = (async () => {
    // Root role
    await prisma.role.upsert({
      where: { slug: 'root-admin' },
      update: {},
      create: { name: 'Root Admin', slug: 'root-admin', system: true, description: 'System root administrator' }
    });
    await prisma.role.upsert({
      where: { slug: 'candidate' },
      update: {},
      create: { name: 'Candidate', slug: 'candidate', system: true }
    });
    await prisma.role.upsert({
      where: { slug: 'employer' },
      update: {},
      create: { name: 'Employer', slug: 'employer', system: true }
    });

    const rootRole = await prisma.role.findUniqueOrThrow({ where: { slug: 'root-admin' } });
    const passwordHash = await bcrypt.hash(env.ROOT_ADMIN_PASSWORD, 12);
    const root = await prisma.user.upsert({
      where: { email: env.ROOT_ADMIN_EMAIL },
      update: { passwordHash, status: 'ACTIVE', emailVerifiedAt: new Date() },
      create: { name: 'Root Admin', email: env.ROOT_ADMIN_EMAIL, passwordHash, status: 'ACTIVE', emailVerifiedAt: new Date() }
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: root.id, roleId: rootRole.id } },
      update: {},
      create: { userId: root.id, roleId: rootRole.id }
    });
  })().catch((error) => {
    // Never crash the server on bootstrap failure; log and continue.
    console.error('Bootstrap failed (continuing):', error instanceof Error ? error.message : error);
  });
  return bootstrapped;
}
