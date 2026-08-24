import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../database/prisma.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { ok } from '../../utils/api-response.js';
import { ApiError } from '../../utils/errors.js';

const updateSchema = z.object({ body: z.object({ title: z.string().optional(), summary: z.string().optional(), expectedSalary: z.number().int().optional(), yearsExperience: z.number().int().optional(), educationLevel: z.string().optional(), districtId: z.string().optional(), upazilaId: z.string().optional(), portfolioUrl: z.string().url().optional() }) });

export const candidatesRouter = Router();
candidatesRouter.use(requireAuth);
candidatesRouter.get('/me', requireRole('candidate'), asyncHandler(async (req, res) => ok(res, await prisma.candidateProfile.findUnique({ where: { userId: req.user!.id }, include: { educations: true, experiences: true, skills: { include: { skill: true } }, district: true, upazila: true } }), 'Candidate profile')));
candidatesRouter.patch('/me', requireRole('candidate'), validate(updateSchema), asyncHandler(async (req, res) => ok(res, await prisma.candidateProfile.upsert({ where: { userId: req.user!.id }, create: { userId: req.user!.id, ...req.body }, update: req.body }), 'Candidate profile updated')));
candidatesRouter.get('/me/cv', requireRole('candidate'), asyncHandler(async (req, res) => {
  const profile = await prisma.candidateProfile.findUnique({ where: { userId: req.user!.id } });
  if (!profile?.cvObjectKey) throw new ApiError(404, 'CV not uploaded');
  const { cloudinaryUrl } = await import('../../firebase/cloudinary.js');
  return ok(res, { objectKey: profile.cvObjectKey, downloadUrl: cloudinaryUrl(profile.cvObjectKey) }, 'Authorized CV reference');
}));
