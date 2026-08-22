import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../database/prisma.js';
import { requireAnyPermission, requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { created, ok } from '../../utils/api-response.js';
import { audit } from '../audit/audit.service.js';

const createSchema = z.object({ body: z.object({ jobId: z.string(), coverLetter: z.string().max(5000).optional(), cvObjectKey: z.string().optional() }) });
const statusSchema = z.object({ params: z.object({ id: z.string() }), body: z.object({ status: z.enum(['VIEWED','SHORTLISTED','INTERVIEW','SELECTED','REJECTED']) }) });

export const applicationsRouter = Router();
applicationsRouter.use(requireAuth);
applicationsRouter.get('/', requireAnyPermission(['applications.view', 'applications.own']), asyncHandler(async (req, res) => {
  const where = req.user!.permissions.includes('applications.view') || req.user!.roles.includes('root-admin') ? {} : { candidateUserId: req.user!.id };
  return ok(res, await prisma.application.findMany({ where, include: { job: { include: { company: true } }, candidate: true }, orderBy: { createdAt: 'desc' } }), 'Applications');
}));
applicationsRouter.post('/', requireAnyPermission(['applications.create']), validate(createSchema), asyncHandler(async (req, res) => {
  const application = await prisma.application.create({ data: { ...req.body, candidateUserId: req.user!.id } });
  await prisma.notification.create({ data: { userId: req.user!.id, type: 'APPLICATION', title: 'Application submitted', body: 'Your application has been submitted.', data: { applicationId: application.id } } });
  return created(res, application, 'Application submitted');
}));
applicationsRouter.patch('/:id/status', requireAnyPermission(['applications.edit']), validate(statusSchema), asyncHandler(async (req, res) => {
  const old = await prisma.application.findUniqueOrThrow({ where: { id: req.params.id } });
  const app = await prisma.application.update({ where: { id: req.params.id }, data: { status: req.body.status } });
  await audit(req, { action: 'applications.status', resource: 'applications', resourceId: app.id, oldValue: old, newValue: app });
  return ok(res, app, 'Application updated');
}));
