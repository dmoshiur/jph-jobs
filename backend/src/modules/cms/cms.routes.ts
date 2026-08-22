import { Router } from 'express';
import { prisma } from '../../database/prisma.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { ok } from '../../utils/api-response.js';

export const cmsRouter = Router();
cmsRouter.get('/pages/:slug', asyncHandler(async (req, res) => ok(res, await prisma.cmsPage.findFirstOrThrow({ where: { slug: req.params.slug, published: true } }), 'CMS page')));
