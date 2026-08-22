import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../database/prisma.js';
import { requireAnyPermission, requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { created, ok } from '../../utils/api-response.js';
import { ApiError } from '../../utils/errors.js';
import { audit } from '../audit/audit.service.js';
import * as controller from './jobs.controller.js';
import { createJobSchema, idParamSchema, listJobsSchema, updateJobSchema } from './jobs.validators.js';
import * as service from './jobs.service.js';

export const jobsRouter = Router();

// ---------- Public ----------
jobsRouter.get('/', validate(listJobsSchema), controller.list);
jobsRouter.get('/x/stats', asyncHandler(async (_req, res) => ok(res, await service.getPublicStats(), 'Stats')));
jobsRouter.get('/x/quick-links', asyncHandler(async (_req, res) => ok(res, await service.getQuickLinkCounts(), 'Quick link counts')));
jobsRouter.get('/x/featured', asyncHandler(async (req, res) => ok(res, await service.getFeatured(Number(req.query.limit) || 8), 'Featured jobs')));
jobsRouter.get('/x/hot', asyncHandler(async (req, res) => ok(res, await service.getHot(Number(req.query.limit) || 6), 'Urgent jobs')));
jobsRouter.get('/x/latest', asyncHandler(async (req, res) => ok(res, await service.getLatest(Number(req.query.limit) || 10), 'Latest jobs')));
jobsRouter.get('/x/deadline-tomorrow', asyncHandler(async (req, res) => ok(res, await service.getDeadlineTomorrow(Number(req.query.limit) || 6), 'Deadline tomorrow')));

// ---------- Authenticated candidate actions ----------
jobsRouter.post('/:id/save', requireAuth, validate(idParamSchema), asyncHandler(async (req, res) => {
  const job = await prisma.job.findFirst({ where: { id: req.params.id, status: { in: ['APPROVED', 'PUBLISHED'] } } });
  if (!job) throw new ApiError(404, 'Job not found');
  await prisma.savedJob.upsert({ where: { userId_jobId: { userId: req.user!.id, jobId: job.id } }, update: {}, create: { userId: req.user!.id, jobId: job.id } });
  return ok(res, { saved: true }, 'Job saved');
}));
jobsRouter.delete('/:id/save', requireAuth, validate(idParamSchema), asyncHandler(async (req, res) => {
  await prisma.savedJob.deleteMany({ where: { userId: req.user!.id, jobId: req.params.id } });
  return ok(res, { saved: false }, 'Job removed');
}));

// ---------- Employer ----------
jobsRouter.get('/mine/list', requireAuth, requireAnyPermission(['jobs.create']), asyncHandler(async (req, res) =>
  ok(res, await service.listMyJobs(req.user!.id), 'My jobs')));
jobsRouter.get('/:id/applicants', requireAuth, requireAnyPermission(['applications.view']), validate(idParamSchema), asyncHandler(async (req, res) =>
  ok(res, await service.getApplicants(req.user!.id, req.params.id), 'Applicants')));

// ---------- Mutations ----------
jobsRouter.post('/', requireAuth, requireAnyPermission(['jobs.create']), validate(createJobSchema), controller.create);
jobsRouter.patch('/:id', requireAuth, requireAnyPermission(['jobs.edit', 'jobs.create']), validate(updateJobSchema), controller.update);

// Must be last: generic detail by id OR slug.
jobsRouter.get('/:id', validate(z.object({ params: z.object({ id: z.string().min(1) }) })), controller.detail);
