import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../database/prisma.js';
import { requireAnyPermission, requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { created, ok } from '../../utils/api-response.js';
import { audit } from '../audit/audit.service.js';

export const reportsRouter = Router();

const createSchema = z.object({
  body: z.object({
    resource: z.enum(['job', 'company', 'business', 'review']),
    resourceId: z.string().min(1),
    reason: z.enum(['fake_job', 'scam', 'advance_payment', 'wrong_information', 'suspicious', 'abuse', 'other']),
    details: z.string().max(2000).optional()
  })
});

reportsRouter.post('/', requireAuth, validate(createSchema), asyncHandler(async (req, res) => {
  const report = await prisma.report.create({ data: { reporterId: req.user!.id, ...req.body } });
  return created(res, report, 'Report submitted');
}));

reportsRouter.get('/', requireAuth, requireAnyPermission(['reports.view']), asyncHandler(async (req, res) => {
  const status = req.query.status as string | undefined;
  const items = await prisma.report.findMany({
    where: status ? { status: status as any } : {},
    include: { reporter: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200
  });
  return ok(res, items, 'Reports');
}));

reportsRouter.patch('/:id/status', requireAuth, requireAnyPermission(['reports.edit']),
  validate(z.object({ params: z.object({ id: z.string() }), body: z.object({ status: z.enum(['OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED']) }) })),
  asyncHandler(async (req, res) => {
    const old = await prisma.report.findUniqueOrThrow({ where: { id: req.params.id } });
    const report = await prisma.report.update({ where: { id: req.params.id }, data: { status: req.body.status } });
    await audit(req, { action: 'reports.status', resource: 'reports', resourceId: report.id, oldValue: { status: old.status }, newValue: { status: report.status } });
    return ok(res, report, 'Report updated');
  }));
