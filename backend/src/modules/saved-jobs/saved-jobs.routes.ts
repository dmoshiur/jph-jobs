import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../database/prisma.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { created, ok } from '../../utils/api-response.js';
import { ApiError } from '../../utils/errors.js';

const JOB_INCLUDE = {
  company: { include: { district: true, upazila: true } },
  category: true,
  district: true,
  upazila: true,
  package: { include: { features: true } }
} as const;

export const savedJobsRouter = Router();
savedJobsRouter.use(requireAuth);

savedJobsRouter.get('/', asyncHandler(async (req, res) => {
  const saved = await prisma.savedJob.findMany({
    where: { userId: req.user!.id, job: { status: { in: ['APPROVED', 'PUBLISHED'] } } },
    include: { job: { include: JOB_INCLUDE } },
    orderBy: { createdAt: 'desc' },
    take: 200
  });
  return ok(res, saved.map((s: any) => ({ ...s.job, savedAt: s.createdAt })), 'Saved jobs');
}));

const toggleSchema = z.object({ body: z.object({ jobId: z.string().min(1) }) });

savedJobsRouter.post('/', validate(toggleSchema), asyncHandler(async (req, res) => {
  const job = await prisma.job.findFirst({ where: { id: req.body.jobId, status: { in: ['APPROVED', 'PUBLISHED'] } } });
  if (!job) throw new ApiError(404, 'Job not found');
  const saved = await prisma.savedJob.upsert({
    where: { userId_jobId: { userId: req.user!.id, jobId: job.id } },
    update: {},
    create: { userId: req.user!.id, jobId: job.id }
  });
  return created(res, saved, 'Job saved');
}));

savedJobsRouter.delete('/:jobId', asyncHandler(async (req, res) => {
  await prisma.savedJob.deleteMany({ where: { userId: req.user!.id, jobId: req.params.jobId } });
  return ok(res, { saved: false }, 'Job removed');
}));
