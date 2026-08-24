import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { created, ok } from '../../utils/api-response.js';
import * as service from './auth.service.js';

export const register = asyncHandler(async (req, res) => {
  const user = await service.register(req.body);
  return created(res, { user }, 'Registration successful');
});

/**
 * With Firebase Auth the client performs login and holds the ID token. This
 * endpoint records the login timestamp and returns the resolved profile for the
 * authenticated caller (the requireAuth middleware has already verified the token).
 */
export const session = asyncHandler(async (req: Request, res: Response) => {
  await service.markLogin(req.user!.id);
  return ok(res, { user: req.user }, 'Session established');
});

export const logout = asyncHandler(async (_req, res) => {
  // Token revocation happens client-side (Firebase signOut). Nothing to clear
  // server-side because auth is stateless Bearer tokens.
  return ok(res, null, 'Logged out');
});

export const me = asyncHandler(async (req, res) => {
  const { prisma } = await import('../../database/prisma.js');
  const { permissionsForRank } = await import('../companies/ranks.js');
  const memberships = await prisma.companyMember.findMany({
    where: { userId: req.user!.id },
    include: { company: { select: { id: true, name: true, slug: true, verificationStatus: true, category: true } } }
  });
  const owned = await prisma.company.findMany({
    where: { ownerId: req.user!.id },
    select: { id: true, name: true, slug: true, verificationStatus: true, category: true }
  });
  const mapped = memberships.map((m: any) => ({
    id: m.id,
    companyId: m.companyId,
    rank: m.role,
    title: m.title,
    permissions: m.permissions?.length ? m.permissions : permissionsForRank(m.role),
    company: m.company
  }));
  return ok(res, {
    user: {
      ...req.user,
      memberships: mapped,
      companies: owned
    }
  }, 'Current user');
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await service.forgotPassword(req.body.email);
  return ok(res, null, 'If the account exists, reset instructions will be sent');
});
