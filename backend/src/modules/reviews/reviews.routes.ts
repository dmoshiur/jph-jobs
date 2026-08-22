import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../database/prisma.js';
import { requireAnyPermission, requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { created, ok } from '../../utils/api-response.js';
import { ApiError } from '../../utils/errors.js';
import { audit } from '../audit/audit.service.js';

export const reviewsRouter = Router();

reviewsRouter.get('/', asyncHandler(async (req, res) => {
  const companyId = req.query.companyId as string | undefined;
  if (!companyId) throw new ApiError(400, 'companyId required');
  const items = await prisma.review.findMany({
    where: { companyId, status: 'APPROVED' },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
  return ok(res, items, 'Reviews');
}));

const createSchema = z.object({
  body: z.object({
    companyId: z.string().min(1),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(2000).optional()
  })
});

reviewsRouter.post('/', requireAuth, validate(createSchema), asyncHandler(async (req, res) => {
  const company = await prisma.company.findUnique({ where: { id: req.body.companyId } });
  if (!company) throw new ApiError(404, 'Company not found');
  const review = await prisma.review.create({ data: { userId: req.user!.id, ...req.body, status: 'PENDING' } });
  return created(res, review, 'Review submitted for moderation');
}));

reviewsRouter.patch('/:id/status', requireAuth, requireAnyPermission(['reviews.edit']),
  validate(z.object({ params: z.object({ id: z.string() }), body: z.object({ status: z.enum(['PENDING', 'APPROVED', 'REJECTED']) }) })),
  asyncHandler(async (req, res) => {
    const old = await prisma.review.findUniqueOrThrow({ where: { id: req.params.id } });
    const review = await prisma.review.update({ where: { id: req.params.id }, data: { status: req.body.status } });
    await audit(req, { action: 'reviews.status', resource: 'reviews', resourceId: review.id, oldValue: { status: old.status }, newValue: { status: review.status } });
    return ok(res, review, 'Review updated');
  }));
