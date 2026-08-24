/**
 * Data access entry point.
 *
 * Historically this exported a PostgreSQL-backed PrismaClient. The platform has
 * been migrated to Firebase — this now exports a Prisma-compatible client whose
 * queries run against Cloud Firestore (see ./orm.ts). The `prisma` name is kept
 * so the existing modules require no churn; there is no SQL anywhere.
 */
import { orm } from './orm.js';

export const prisma = orm;
export default prisma;
