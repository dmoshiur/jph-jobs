import { Router } from 'express';
import { prisma } from '../../database/prisma.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { ok } from '../../utils/api-response.js';

export const packagesRouter = Router();

packagesRouter.get('/', asyncHandler(async (_req, res) => {
  const packages = await prisma.package.findMany({
    where: { isActive: true },
    include: { features: true },
    orderBy: { sortOrder: 'asc' }
  });
  return ok(res, packages, 'Packages');
}));
