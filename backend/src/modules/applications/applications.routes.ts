import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../database/prisma.js';
import { requireAnyPermission, requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { created, ok } from '../../utils/api-response.js';
import { ApiError, ForbiddenError } from '../../utils/errors.js';
import { audit } from '../audit/audit.service.js';

const APP_INCLUDE = {
  job: { include: { company: { include: { district: true, upazila: true } }, category: true, district: true, upazila: true } },
  candidate: { select: { id: true, name: true, email: true, phone: true, candidateProfile: true } }
} as const;

const createSchema = z.object({
  body: z.object({
    jobId: z.string(),
    coverLetter: z.string().max(5000).optional(),
    cvObjectKey: z.string().optional()
  })
});

const statusSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({ status: z.enum(['VIEWED', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED']) })
});

export const applicationsRouter = Router();
applicationsRouter.use(requireAuth);

applicationsRouter.get('/', requireAnyPermission(['applications.view', 'applications.own']), asyncHandler(async (req, res) => {
  const canViewAll = req.user!.permissions.includes('applications.view') || req.user!.roles.includes('root-admin');
  const where = canViewAll ? {} : { candidateUserId: req.user!.id };
  const items = await prisma.application.findMany({ where, include: APP_INCLUDE, orderBy: { createdAt: 'desc' } });
  return ok(res, items, 'Applications');
}));

applicationsRouter.post('/', requireAnyPermission(['applications.create']), validate(createSchema), asyncHandler(async (req, res) => {
  const job = await prisma.job.findFirst({
    where: { id: req.body.jobId, status: { in: ['APPROVED', 'PUBLISHED'] } },
    include: { company: true }
  });
  if (!job) throw new ApiError(404, 'Job not found or no longer accepting applications');
  if (new Date(job.deadline) < new Date()) throw new ApiError(400, 'Application deadline has passed');

  const existing = await prisma.application.findUnique({ where: { jobId_candidateUserId: { jobId: job.id, candidateUserId: req.user!.id } } });
  if (existing) throw new ApiError(409, 'You have already applied to this job');

  // Use candidate's uploaded CV if no explicit key provided.
  let cvObjectKey = req.body.cvObjectKey;
  if (!cvObjectKey) {
    const profile = await prisma.candidateProfile.findUnique({ where: { userId: req.user!.id } });
    cvObjectKey = profile?.cvObjectKey ?? undefined;
  }

  const application = await prisma.application.create({
    data: { jobId: job.id, candidateUserId: req.user!.id, coverLetter: req.body.coverLetter, cvObjectKey },
    include: APP_INCLUDE
  });

  await prisma.notification.createMany({
    data: [
      { userId: req.user!.id, type: 'APPLICATION', title: 'আবেদন জমা হয়েছে', body: `আপনার "${job.title}" পদে আবেদন সফলভাবে জমা হয়েছে।`, data: { applicationId: application.id, jobId: job.id } },
      { userId: job.company.ownerId, type: 'APPLICATION', title: 'নতুন আবেদন', body: `"${job.title}" পদে একজন নতুন প্রার্থী আবেদন করেছেন।`, data: { applicationId: application.id, jobId: job.id } }
    ]
  });

  return created(res, application, 'Application submitted');
}));

applicationsRouter.get('/:id', asyncHandler(async (req, res) => {
  const app = await prisma.application.findUnique({ where: { id: req.params.id }, include: APP_INCLUDE });
  if (!app) throw new ApiError(404, 'Application not found');
  const isOwner = app.candidateUserId === req.user!.id;
  const canViewAll = req.user!.permissions.includes('applications.view');
  const isEmployer = app.job.company.ownerId === req.user!.id;
  if (!isOwner && !canViewAll && !isEmployer) throw new ForbiddenError('Not allowed');
  return ok(res, app, 'Application');
}));

applicationsRouter.patch('/:id/status', requireAnyPermission(['applications.edit']), validate(statusSchema), asyncHandler(async (req, res) => {
  const old = await prisma.application.findUniqueOrThrow({ where: { id: req.params.id }, include: { job: true } });
  const application = await prisma.application.update({ where: { id: req.params.id }, data: { status: req.body.status }, include: APP_INCLUDE });
  const labels: Record<string, string> = {
    VIEWED: 'আপনার আবেদন দেখা হয়েছে',
    SHORTLISTED: 'আপনাকে শর্টলিস্ট করা হয়েছে',
    INTERVIEW: 'ইন্টারভিউয়ের জন্য নির্বাচিত',
    SELECTED: 'অভিনন্দন! আপনি নির্বাচিত হয়েছেন',
    REJECTED: 'আপনার আবেদনটি বিবেচনা করা হয়নি'
  };
  await prisma.notification.create({
    data: { userId: old.candidateUserId, type: 'APPLICATION', title: 'আবেদনের আপডেট', body: labels[req.body.status] ?? 'আপনার আবেদনের অবস্থা পরিবর্তন হয়েছে।', data: { applicationId: old.id, jobId: old.jobId, status: req.body.status } }
  });
  await audit(req, { action: 'applications.status', resource: 'applications', resourceId: application.id, oldValue: { status: old.status }, newValue: { status: application.status } });
  return ok(res, application, 'Application updated');
}));

applicationsRouter.post('/:id/withdraw', asyncHandler(async (req, res) => {
  const existing = await prisma.application.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, 'Application not found');
  if (existing.candidateUserId !== req.user!.id) throw new ForbiddenError('Not allowed');
  if (['SELECTED', 'WITHDRAWN'].includes(existing.status)) throw new ApiError(400, 'Application cannot be withdrawn');
  const application = await prisma.application.update({ where: { id: req.params.id }, data: { status: 'WITHDRAWN' } });
  return ok(res, application, 'Application withdrawn');
}));
