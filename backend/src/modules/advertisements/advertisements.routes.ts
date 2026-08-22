import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../database/prisma.js';
import { requireAnyPermission, requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { created, ok } from '../../utils/api-response.js';
import { audit } from '../audit/audit.service.js';

export const advertisementsRouter = Router();

// Public: serve currently active ads for a placement
advertisementsRouter.get('/active', asyncHandler(async (req, res) => {
  const placement = String(req.query.placement ?? 'homepage_banner');
  const now = new Date();
  const items = await prisma.advertisement.findMany({
    where: { status: 'ACTIVE', placement, startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
    orderBy: { createdAt: 'desc' },
    take: 6
  });
  return ok(res, items, 'Advertisements');
}));

const createSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(160),
    placement: z.enum(['homepage_banner', 'sidebar', 'featured_business', 'sponsored_job', 'listing_top']),
    targetUrl: z.string().url().optional(),
    imageObjectKey: z.string().optional(),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional(),
    status: z.enum(['DRAFT', 'PENDING', 'ACTIVE', 'EXPIRED', 'REJECTED']).default('DRAFT')
  })
});

advertisementsRouter.get('/', requireAuth, requireAnyPermission(['advertisements.view']), asyncHandler(async (req, res) =>
  ok(res, await prisma.advertisement.findMany({ include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: 'desc' }, take: 200 }), 'Advertisements')));

advertisementsRouter.post('/', requireAuth, requireAnyPermission(['advertisements.edit']), validate(createSchema), asyncHandler(async (req, res) => {
  const ad = await prisma.advertisement.create({ data: { ...req.body, userId: req.user!.id } });
  await audit(req, { action: 'advertisements.create', resource: 'advertisements', resourceId: ad.id });
  return created(res, ad, 'Advertisement created');
}));

advertisementsRouter.patch('/:id', requireAuth, requireAnyPermission(['advertisements.edit']),
  validate(createSchema.deepPartial().extend({ params: z.object({ id: z.string() }) })),
  asyncHandler(async (req, res) => {
    const old = await prisma.advertisement.findUniqueOrThrow({ where: { id: req.params.id } });
    const ad = await prisma.advertisement.update({ where: { id: req.params.id }, data: req.body });
    await audit(req, { action: 'advertisements.edit', resource: 'advertisements', resourceId: ad.id, oldValue: { status: old.status }, newValue: { status: ad.status } });
    return ok(res, ad, 'Advertisement updated');
  }));
