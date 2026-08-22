import { Router } from 'express';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { prisma } from '../../database/prisma.js';
import { requireAnyPermission, requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { created, ok } from '../../utils/api-response.js';
import { ApiError, ForbiddenError } from '../../utils/errors.js';
import { slugify } from '../../utils/slug.js';
import { audit } from '../audit/audit.service.js';

const COMPANY_INCLUDE = {
  district: true,
  upazila: true,
  owner: { select: { id: true, name: true, email: true } }
} as const;

const createSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(160),
    about: z.string().max(8000).optional(),
    category: z.string().max(80).optional(),
    address: z.string().max(300).optional(),
    districtId: z.string().optional(),
    upazilaId: z.string().optional(),
    phone: z.string().max(30).optional(),
    email: z.string().email().optional(),
    website: z.string().url().optional(),
    socialLinks: z.record(z.string()).optional()
  })
});

const listSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    districtId: z.string().optional(),
    category: z.string().optional(),
    verified: z.enum(['true', 'false']).optional(),
    hiring: z.enum(['true', 'false']).optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(12)
  })
});

export const companiesRouter = Router();

companiesRouter.get('/', validate(listSchema), asyncHandler(async (req, res) => {
  const q = req.query as any;
  const where: any = {
    verificationStatus: q.verified === 'false' ? { not: 'VERIFIED' } : 'VERIFIED'
  };
  if (q.q) where.name = { contains: q.q, mode: 'insensitive' };
  if (q.districtId) where.districtId = q.districtId;
  if (q.category) where.category = q.category;
  if (q.hiring === 'true') where.jobs = { some: { status: { in: ['APPROVED', 'PUBLISHED'] }, deadline: { gt: new Date() } } };

  const [items, total] = await Promise.all([
    prisma.company.findMany({
      where,
      include: {
        ...COMPANY_INCLUDE,
        _count: { select: { jobs: { where: { status: { in: ['APPROVED', 'PUBLISHED'] }, deadline: { gt: new Date() } } } } }
      },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.company.count({ where })
  ]);
  return ok(res, { items, total, page: q.page, limit: q.limit, pages: Math.ceil(total / q.limit) }, 'Companies');
}));

companiesRouter.get('/top', asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 6, 12);
  const items = await prisma.company.findMany({
    where: { verificationStatus: 'VERIFIED', jobs: { some: { status: { in: ['APPROVED', 'PUBLISHED'] }, deadline: { gt: new Date() } } } },
    include: {
      ...COMPANY_INCLUDE,
      _count: { select: { jobs: { where: { status: { in: ['APPROVED', 'PUBLISHED'] }, deadline: { gt: new Date() } } } } }
    },
    orderBy: { jobs: { _count: 'desc' } },
    take: limit
  });
  return ok(res, { items }, 'Top companies');
}));

companiesRouter.get('/by-slug/:slug', asyncHandler(async (req, res) => {
  const company = await prisma.company.findUnique({
    where: { slug: req.params.slug },
    include: {
      ...COMPANY_INCLUDE,
      jobs: {
        where: { status: { in: ['APPROVED', 'PUBLISHED'] }, deadline: { gt: new Date() } },
        orderBy: { publishedAt: 'desc' },
        include: { category: true, district: true, package: true }
      }
    }
  });
  if (!company) throw new ApiError(404, 'Company not found');
  return ok(res, company, 'Company');
}));

companiesRouter.get('/:id', asyncHandler(async (req, res) => {
  const company = await prisma.company.findFirst({
    where: { OR: [{ id: req.params.id }, { slug: req.params.id }] },
    include: {
      ...COMPANY_INCLUDE,
      jobs: {
        where: { status: { in: ['APPROVED', 'PUBLISHED'] }, deadline: { gt: new Date() } },
        orderBy: { publishedAt: 'desc' },
        include: { category: true, district: true, package: true }
      }
    }
  });
  if (!company) throw new ApiError(404, 'Company not found');
  return ok(res, company, 'Company');
}));

companiesRouter.post('/', requireAuth, requireAnyPermission(['companies.create']), validate(createSchema), asyncHandler(async (req, res) => {
  const slug = `${slugify(req.body.name)}-${nanoid(6)}`;
  const company = await prisma.company.create({
    data: {
      ...req.body,
      ownerId: req.user!.id,
      slug,
      verificationStatus: 'PENDING',
      members: { create: { userId: req.user!.id, role: 'owner', permissions: ['companies.edit', 'jobs.create', 'applications.view'] } }
    }
  });
  await audit(req, { action: 'companies.create', resource: 'companies', resourceId: company.id, newValue: { id: company.id, name: company.name } });
  return created(res, company, 'Company created — pending verification');
}));

companiesRouter.patch('/:id', requireAuth, requireAnyPermission(['companies.edit']),
  validate(createSchema.deepPartial().extend({ params: z.object({ id: z.string() }) })),
  asyncHandler(async (req, res) => {
    const existing = await prisma.company.findUniqueOrThrow({ where: { id: req.params.id } });
    const isOwner = existing.ownerId === req.user!.id;
    const isMember = await prisma.companyMember.findFirst({ where: { companyId: req.params.id, userId: req.user!.id } });
    const isAdmin = req.user!.permissions.includes('companies.verify');
    if (!isOwner && !isMember && !isAdmin) throw new ForbiddenError('Cannot edit this company');
    const { id, ownerId, verificationStatus, slug, ...allowed } = req.body as Record<string, unknown>;
    const old = existing;
    const company = await prisma.company.update({ where: { id: req.params.id }, data: allowed });
    await audit(req, { action: 'companies.edit', resource: 'companies', resourceId: company.id, oldValue: { verificationStatus: old.verificationStatus }, newValue: allowed });
    return ok(res, company, 'Company updated');
  }));
