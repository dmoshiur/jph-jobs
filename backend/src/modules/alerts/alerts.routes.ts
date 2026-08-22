import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../database/prisma.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { created, ok } from '../../utils/api-response.js';
import { ApiError } from '../../utils/errors.js';

export const alertsRouter = Router();
alertsRouter.use(requireAuth);

alertsRouter.get('/', asyncHandler(async (req, res) =>
  ok(res, await prisma.jobAlert.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' } }), 'Job alerts')));

const createSchema = z.object({
  body: z.object({
    query: z.record(z.unknown()).default({}),
    frequency: z.enum(['daily', 'weekly', 'instant']).default('daily'),
    isActive: z.boolean().default(true)
  })
});

alertsRouter.post('/', validate(createSchema), asyncHandler(async (req, res) => {
  const alert = await prisma.jobAlert.create({ data: { userId: req.user!.id, query: req.body.query, frequency: req.body.frequency, isActive: req.body.isActive } });
  return created(res, alert, 'Job alert created');
}));

alertsRouter.patch('/:id', validate(createSchema.deepPartial().extend({ params: z.object({ id: z.string() }) })), asyncHandler(async (req, res) => {
  const existing = await prisma.jobAlert.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.userId !== req.user!.id) throw new ApiError(404, 'Alert not found');
  return ok(res, await prisma.jobAlert.update({ where: { id: req.params.id }, data: req.body }), 'Alert updated');
}));

alertsRouter.delete('/:id', asyncHandler(async (req, res) => {
  await prisma.jobAlert.deleteMany({ where: { id: req.params.id, userId: req.user!.id } });
  return ok(res, null, 'Alert deleted');
}));
