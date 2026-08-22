import { Router } from 'express';
import { prisma } from '../../database/prisma.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { ok } from '../../utils/api-response.js';

export const skillsRouter = Router();

skillsRouter.get('/', asyncHandler(async (req, res) => {
  const skills = await prisma.skill.findMany({
    where: req.query.q ? { name: { contains: req.query.q as string, mode: 'insensitive' } } : {},
    orderBy: { name: 'asc' },
    take: 50
  });
  return ok(res, skills, 'Skills');
}));
