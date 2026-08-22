import { Router } from 'express';
import { prisma } from '../../database/prisma.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { ok } from '../../utils/api-response.js';
import * as jobsService from '../jobs/jobs.service.js';

export const publicRouter = Router();

publicRouter.get('/stats', asyncHandler(async (_req, res) =>
  ok(res, await jobsService.getPublicStats(), 'Public stats')));

publicRouter.get('/quick-links', asyncHandler(async (_req, res) =>
  ok(res, await jobsService.getQuickLinkCounts(), 'Quick links')));

publicRouter.get('/categories', asyncHandler(async (_req, res) => {
  const categories = await prisma.jobCategory.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    include: { _count: { select: { jobs: { where: { status: { in: ['APPROVED', 'PUBLISHED'] }, deadline: { gt: new Date() } } } } } }
  });
  return ok(res, categories.map((c: any) => ({
    id: c.id, name: c.name, slug: c.slug, description: c.description, jobCount: c._count.jobs
  })), 'Categories');
}));

publicRouter.get('/locations', asyncHandler(async (req, res) => {
  const districts = await prisma.location.findMany({
    where: { type: 'DISTRICT', isActive: true, slug: { in: ['bogura', 'joypurhat'] } },
    orderBy: { name: 'asc' },
    include: {
      children: { where: { isActive: true }, orderBy: { name: 'asc' } },
      _count: { select: { districtJobs: { where: { status: { in: ['APPROVED', 'PUBLISHED'] }, deadline: { gt: new Date() } } } } }
    }
  });
  const popular = req.query.popular === 'true'
    ? await prisma.location.findMany({
        where: { type: 'UPAZILA', isActive: true, parent: { slug: { in: ['bogura', 'joypurhat'] } } },
        orderBy: { name: 'asc' }
      })
    : [];
  return ok(res, { districts, popularUpazilas: popular }, 'Locations');
}));

publicRouter.get('/search/suggest', asyncHandler(async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  if (q.length < 2) return ok(res, { jobs: [], companies: [], categories: [] }, 'Suggestions');
  const [jobs, companies, categories] = await Promise.all([
    prisma.job.findMany({
      where: { status: { in: ['APPROVED', 'PUBLISHED'] }, deadline: { gt: new Date() }, title: { contains: q, mode: 'insensitive' } },
      select: { id: true, title: true, slug: true, company: { select: { name: true } } },
      take: 6, orderBy: { publishedAt: 'desc' }
    }),
    prisma.company.findMany({
      where: { verificationStatus: 'VERIFIED', name: { contains: q, mode: 'insensitive' } },
      select: { id: true, name: true, slug: true }, take: 4
    }),
    prisma.jobCategory.findMany({ where: { name: { contains: q, mode: 'insensitive' } }, select: { id: true, name: true, slug: true }, take: 4 })
  ]);
  return ok(res, { jobs, companies, categories }, 'Suggestions');
}));
