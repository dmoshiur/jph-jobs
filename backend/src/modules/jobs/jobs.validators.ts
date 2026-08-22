import { z } from 'zod';

export const listJobsSchema = z.object({
  query: z.object({
    q: z.string().optional(), districtId: z.string().optional(), categoryId: z.string().optional(), type: z.string().optional(),
    page: z.coerce.number().min(1).default(1), limit: z.coerce.number().min(1).max(50).default(12)
  })
});

export const idParamSchema = z.object({ params: z.object({ id: z.string().min(1) }) });

export const createJobSchema = z.object({
  body: z.object({
    companyId: z.string().min(1), categoryId: z.string().optional(), packageId: z.string().optional(),
    title: z.string().min(3).max(180), type: z.enum(['FULL_TIME','PART_TIME','INTERNSHIP','CONTRACT','TEMPORARY','REMOTE','ON_SITE']),
    vacancy: z.number().int().min(1).default(1), salaryMin: z.number().int().optional(), salaryMax: z.number().int().optional(), salaryText: z.string().optional(),
    experience: z.string().optional(), education: z.string().optional(), responsibilities: z.string().min(10), requirements: z.string().min(10), benefits: z.string().optional(),
    districtId: z.string().optional(), upazilaId: z.string().optional(), deadline: z.coerce.date(), skillIds: z.array(z.string()).default([])
  })
});

export const updateJobSchema = createJobSchema.deepPartial().extend({ params: z.object({ id: z.string().min(1) }) });
