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
import { canEditSettings, canManageMembers, COMPANY_RANKS, permissionsForRank, rankLevel } from './ranks.js';

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
    kind: z.enum(['company', 'shop']).optional(),
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

companiesRouter.get('/mine', requireAuth, asyncHandler(async (req, res) => {
  const items = await prisma.company.findMany({
    where: { OR: [{ ownerId: req.user!.id }, { members: { some: { userId: req.user!.id } } }] },
    include: {
      ...COMPANY_INCLUDE,
      members: { where: { userId: req.user!.id } },
      _count: { select: { jobs: true, members: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  return ok(res, items.map((c: any) => {
    const member = c.members[0];
    const rank = member?.role ?? (c.ownerId === req.user!.id ? 'owner' : 'staff');
    return { ...c, myRank: rank, myPermissions: permissionsForRank(rank) };
  }), 'My companies');
}));

companiesRouter.get('/ranks', requireAuth, asyncHandler(async (_req, res) =>
  ok(res, COMPANY_RANKS, 'Company ranks')));

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
  const { kind, ...rest } = req.body as { kind?: 'company' | 'shop'; name: string; category?: string };
  const isShop = kind === 'shop' || req.user!.roles.includes('shop-owner');
  const rank = isShop ? 'shop_owner' : 'owner';
  const slug = `${slugify(req.body.name)}-${nanoid(6)}`;
  const company = await prisma.company.create({
    data: {
      ...rest,
      category: rest.category || (isShop ? 'Shop' : undefined),
      ownerId: req.user!.id,
      slug,
      verificationStatus: 'PENDING',
      members: { create: { userId: req.user!.id, role: rank, title: isShop ? 'Shop Owner' : 'Owner', permissions: permissionsForRank(rank) } }
    }
  });
  await audit(req, { action: 'companies.create', resource: 'companies', resourceId: company.id, newValue: { id: company.id, name: company.name } });
  return created(res, company, isShop ? 'Shop created — pending verification' : 'Company created — pending verification');
}));

companiesRouter.patch('/:id', requireAuth, requireAnyPermission(['companies.edit']),
  validate(createSchema.deepPartial().extend({ params: z.object({ id: z.string() }) })),
  asyncHandler(async (req, res) => {
    const existing = await prisma.company.findUniqueOrThrow({ where: { id: req.params.id } });
    const isOwner = existing.ownerId === req.user!.id;
    const isMember = await prisma.companyMember.findFirst({ where: { companyId: req.params.id, userId: req.user!.id } });
    const isAdmin = req.user!.permissions.includes('companies.verify');
    if (!isOwner && !isMember && !isAdmin) throw new ForbiddenError('Cannot edit this company');
    if (!isAdmin && !isOwner && isMember && !canEditSettings(isMember.role)) throw new ForbiddenError('Your rank cannot change company settings');
    const { id, ownerId, verificationStatus, slug, ...allowed } = req.body as Record<string, unknown>;
    const old = existing;
    const company = await prisma.company.update({ where: { id: req.params.id }, data: allowed });
    await audit(req, { action: 'companies.edit', resource: 'companies', resourceId: company.id, oldValue: { verificationStatus: old.verificationStatus }, newValue: allowed });
    return ok(res, company, 'Company updated');
  }));

async function actorRank(companyId: string, userId: string, ownerId: string) {
  if (ownerId === userId) return 'owner';
  const member = await prisma.companyMember.findFirst({ where: { companyId, userId } });
  return member?.role ?? null;
}

companiesRouter.get('/:id/members', requireAuth, asyncHandler(async (req, res) => {
  const company = await prisma.company.findUniqueOrThrow({ where: { id: req.params.id } });
  const rank = await actorRank(company.id, req.user!.id, company.ownerId);
  const isAdmin = req.user!.roles.some((r) => ['root-admin', 'super-admin'].includes(r));
  if (!rank && !isAdmin) throw new ForbiddenError('Not a member of this company');
  const members = await prisma.companyMember.findMany({
    where: { companyId: company.id },
    include: { user: { select: { id: true, name: true, email: true, phone: true, status: true } } },
    orderBy: { createdAt: 'asc' }
  });
  return ok(res, members.map((m: { permissions?: string[]; role: string }) => ({
    ...m,
    permissions: m.permissions?.length ? m.permissions : permissionsForRank(m.role)
  })), 'Members');
}));

companiesRouter.post('/:id/members', requireAuth, validate(z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    email: z.string().email().toLowerCase(),
    rank: z.enum(COMPANY_RANKS),
    title: z.string().max(80).optional()
  })
})), asyncHandler(async (req, res) => {
  const company = await prisma.company.findUniqueOrThrow({ where: { id: req.params.id } });
  const actor = await actorRank(company.id, req.user!.id, company.ownerId);
  const isAdmin = req.user!.roles.some((r) => ['root-admin', 'super-admin'].includes(r));
  if (!isAdmin && (!actor || !canManageMembers(actor))) throw new ForbiddenError('Your rank cannot add team members');
  if (!isAdmin && actor && rankLevel(req.body.rank) >= rankLevel(actor)) throw new ForbiddenError('Cannot assign a rank equal or higher than yours');

  const user = await prisma.user.findUnique({ where: { email: req.body.email } });
  if (!user) throw new ApiError(404, 'No user with that email. They must register first.');

  const member = await prisma.companyMember.upsert({
    where: { companyId_userId: { companyId: company.id, userId: user.id } },
    update: { role: req.body.rank, title: req.body.title, permissions: permissionsForRank(req.body.rank) },
    create: { companyId: company.id, userId: user.id, role: req.body.rank, title: req.body.title, permissions: permissionsForRank(req.body.rank) },
    include: { user: { select: { id: true, name: true, email: true } } }
  });
  await audit(req, { action: 'companies.members.add', resource: 'company_members', resourceId: member.id, newValue: { email: user.email, rank: req.body.rank } });
  return created(res, member, 'Member added');
}));

companiesRouter.patch('/:id/members/:memberId', requireAuth, validate(z.object({
  params: z.object({ id: z.string(), memberId: z.string() }),
  body: z.object({ rank: z.enum(COMPANY_RANKS).optional(), title: z.string().max(80).optional() })
})), asyncHandler(async (req, res) => {
  const company = await prisma.company.findUniqueOrThrow({ where: { id: req.params.id } });
  const actor = await actorRank(company.id, req.user!.id, company.ownerId);
  const isAdmin = req.user!.roles.some((r) => ['root-admin', 'super-admin'].includes(r));
  if (!isAdmin && (!actor || !canManageMembers(actor))) throw new ForbiddenError('Your rank cannot change team ranks');

  const target = await prisma.companyMember.findFirstOrThrow({ where: { id: req.params.memberId, companyId: company.id } });
  if (!isAdmin && actor && rankLevel(target.role) >= rankLevel(actor)) throw new ForbiddenError('Cannot change a peer or senior rank');
  if (req.body.rank && !isAdmin && actor && rankLevel(req.body.rank) >= rankLevel(actor)) throw new ForbiddenError('Cannot promote to your rank or above');

  const member = await prisma.companyMember.update({
    where: { id: target.id },
    data: {
      ...(req.body.rank ? { role: req.body.rank, permissions: permissionsForRank(req.body.rank) } : {}),
      ...(req.body.title !== undefined ? { title: req.body.title } : {})
    },
    include: { user: { select: { id: true, name: true, email: true } } }
  });
  await audit(req, { action: 'companies.members.edit', resource: 'company_members', resourceId: member.id, oldValue: { rank: target.role }, newValue: { rank: member.role } });
  return ok(res, member, 'Member updated');
}));

companiesRouter.delete('/:id/members/:memberId', requireAuth, asyncHandler(async (req, res) => {
  const company = await prisma.company.findUniqueOrThrow({ where: { id: req.params.id } });
  const actor = await actorRank(company.id, req.user!.id, company.ownerId);
  const isAdmin = req.user!.roles.some((r) => ['root-admin', 'super-admin'].includes(r));
  if (!isAdmin && (!actor || !canManageMembers(actor))) throw new ForbiddenError('Your rank cannot remove team members');
  const target = await prisma.companyMember.findFirstOrThrow({ where: { id: req.params.memberId, companyId: company.id } });
  if (target.userId === company.ownerId) throw new ForbiddenError('Cannot remove the company owner');
  if (!isAdmin && actor && rankLevel(target.role) >= rankLevel(actor)) throw new ForbiddenError('Cannot remove a peer or senior');
  await prisma.companyMember.delete({ where: { id: target.id } });
  await audit(req, { action: 'companies.members.remove', resource: 'company_members', resourceId: target.id });
  return ok(res, null, 'Member removed');
}));

