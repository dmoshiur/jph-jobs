import { Router } from 'express';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { prisma } from '../../database/prisma.js';
import { requireAnyPermission, requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { created, ok } from '../../utils/api-response.js';
import { slugify } from '../../utils/slug.js';

const businessCategories = ['Electronics','Restaurant','Pharmacy','Hospital','Furniture','Automobile','Education','IT','Construction','Retail','Wholesale','Real Estate','Courier','Manufacturing','Others'] as const;
const listSchema = z.object({ query: z.object({ q: z.string().optional(), category: z.string().optional(), districtId: z.string().optional(), page: z.coerce.number().min(1).default(1), limit: z.coerce.number().min(1).max(50).default(12) }) });
const createSchema = z.object({ body: z.object({ name: z.string().min(2), category: z.enum(businessCategories), description: z.string().optional(), address: z.string().optional(), districtId: z.string().optional(), upazilaId: z.string().optional(), phone: z.string().optional(), email: z.string().email().optional(), website: z.string().url().optional() }) });

export const businessesRouter = Router();
businessesRouter.get('/', validate(listSchema), asyncHandler(async (req, res) => {
  const q = req.query as any;
  const where = { ...(q.q ? { name: { contains: q.q, mode: 'insensitive' as const } } : {}), ...(q.category ? { category: q.category } : {}), ...(q.districtId ? { districtId: q.districtId } : {}) };
  const [items, total] = await Promise.all([
    prisma.businessListing.findMany({ where, include: { district: true, upazila: true }, skip: (q.page - 1) * q.limit, take: q.limit, orderBy: { createdAt: 'desc' } }),
    prisma.businessListing.count({ where })
  ]);
  return ok(res, { items, total, page: q.page, limit: q.limit, pages: Math.ceil(total / q.limit) }, 'Businesses');
}));
businessesRouter.post('/', requireAuth, requireAnyPermission(['businesses.create']), validate(createSchema), asyncHandler(async (req, res) => {
  const business = await prisma.businessListing.create({ data: { ...req.body, ownerId: req.user!.id, slug: `${slugify(req.body.name)}-${nanoid(6)}` } });
  return created(res, business, 'Business listing created');
}));
