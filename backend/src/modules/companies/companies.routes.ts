import { Router } from 'express';
import { z } from 'zod';
import { requireAnyPermission, requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { created, ok } from '../../utils/api-response.js';
import { prisma } from '../../database/prisma.js';
import { slugify } from '../../utils/slug.js';
import { nanoid } from 'nanoid';
import { audit } from '../audit/audit.service.js';

const createSchema = z.object({ body: z.object({ name: z.string().min(2), about: z.string().optional(), category: z.string().optional(), address: z.string().optional(), districtId: z.string().optional(), upazilaId: z.string().optional(), phone: z.string().optional(), email: z.string().email().optional(), website: z.string().url().optional(), socialLinks: z.record(z.string()).optional() }) });
const listSchema = z.object({ query: z.object({ q: z.string().optional(), districtId: z.string().optional(), category: z.string().optional(), page: z.coerce.number().min(1).default(1), limit: z.coerce.number().min(1).max(50).default(12) }) });

export const companiesRouter = Router();
companiesRouter.get('/', validate(listSchema), asyncHandler(async (req, res) => {
  const q = req.query as any;
  const where = { verificationStatus: { in: ['PENDING', 'VERIFIED'] as const }, ...(q.q ? { name: { contains: q.q, mode: 'insensitive' as const } } : {}), ...(q.districtId ? { districtId: q.districtId } : {}), ...(q.category ? { category: q.category } : {}) };
  const [items, total] = await Promise.all([
    prisma.company.findMany({ where, include: { district: true, upazila: true, _count: { select: { jobs: true } } }, skip: (q.page - 1) * q.limit, take: q.limit, orderBy: { createdAt: 'desc' } }),
    prisma.company.count({ where })
  ]);
  return ok(res, { items, total, page: q.page, limit: q.limit, pages: Math.ceil(total / q.limit) }, 'Companies');
}));
companiesRouter.get('/:id', asyncHandler(async (req, res) => ok(res, await prisma.company.findUniqueOrThrow({ where: { id: req.params.id }, include: { district: true, upazila: true, jobs: { where: { status: { in: ['APPROVED', 'PUBLISHED'] } } } } }), 'Company')));
companiesRouter.post('/', requireAuth, requireAnyPermission(['companies.create']), validate(createSchema), asyncHandler(async (req, res) => {
  const company = await prisma.company.create({ data: { ...req.body, ownerId: req.user!.id, slug: `${slugify(req.body.name)}-${nanoid(6)}`, members: { create: { userId: req.user!.id, role: 'owner', permissions: ['companies.edit', 'jobs.create', 'applications.view'] } } } });
  await audit(req, { action: 'companies.create', resource: 'companies', resourceId: company.id, newValue: company });
  return created(res, company, 'Company created');
}));
companiesRouter.patch('/:id', requireAuth, requireAnyPermission(['companies.edit']), validate(createSchema.deepPartial().extend({ params: z.object({ id: z.string() }) })), asyncHandler(async (req, res) => {
  const old = await prisma.company.findUniqueOrThrow({ where: { id: req.params.id } });
  const company = await prisma.company.update({ where: { id: req.params.id }, data: req.body });
  await audit(req, { action: 'companies.edit', resource: 'companies', resourceId: company.id, oldValue: old, newValue: company });
  return ok(res, company, 'Company updated');
}));
