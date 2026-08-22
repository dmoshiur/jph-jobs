import { z } from 'zod';

export const listJobsSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    districtId: z.string().optional(),
    upazilaId: z.string().optional(),
    location: z.string().optional(), // slug (district or upazila)
    categoryId: z.string().optional(),
    category: z.string().optional(), // slug
    type: z.enum(['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT', 'TEMPORARY', 'REMOTE', 'ON_SITE']).optional(),
    salaryMin: z.coerce.number().optional(),
    experience: z.string().optional(),
    education: z.string().optional(),
    companyId: z.string().optional(),
    verified: z.enum(['true', 'false']).optional(),
    featured: z.enum(['true', 'false']).optional(),
    hot: z.enum(['true', 'false']).optional(),
    postedWithin: z.enum(['24h', '7d', '30d']).optional(),
    sort: z.enum(['newest', 'deadline', 'salary', 'relevance']).default('newest'),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(12)
  })
});

export const idParamSchema = z.object({ params: z.object({ id: z.string().min(1) }) });
export const slugParamSchema = z.object({ params: z.object({ slug: z.string().min(1) }) });

export const createJobSchema = z.object({
  body: z.object({
    companyId: z.string().min(1),
    categoryId: z.string().optional(),
    packageId: z.string().optional(),
    title: z.string().min(3).max(180),
    type: z.enum(['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT', 'TEMPORARY', 'REMOTE', 'ON_SITE']),
    vacancy: z.number().int().min(1).max(10000).default(1),
    salaryMin: z.number().int().nonnegative().optional(),
    salaryMax: z.number().int().nonnegative().optional(),
    salaryText: z.string().max(60).optional(),
    experience: z.string().max(60).optional(),
    education: z.string().max(120).optional(),
    responsibilities: z.string().min(10),
    requirements: z.string().min(10),
    benefits: z.string().max(4000).optional(),
    districtId: z.string().optional(),
    upazilaId: z.string().optional(),
    deadline: z.coerce.date(),
    skillIds: z.array(z.string()).default([]),
    // When a free package is used the job can be published directly (subject to moderation flag).
    publishNow: z.boolean().default(false)
  })
});

export const updateJobSchema = createJobSchema.deepPartial().extend({
  params: z.object({ id: z.string().min(1) })
});
