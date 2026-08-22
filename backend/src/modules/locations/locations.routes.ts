import { Router } from 'express';
import { prisma } from '../../database/prisma.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { ok } from '../../utils/api-response.js';

export const locationsRouter = Router();
locationsRouter.get('/', asyncHandler(async (req, res) => ok(res, await prisma.location.findMany({ where: { isActive: true, ...(req.query.type ? { type: req.query.type as any } : {}), ...(req.query.parentId ? { parentId: req.query.parentId as string } : {}) }, orderBy: { name: 'asc' } }), 'Locations')));
