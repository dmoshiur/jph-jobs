import { Router } from 'express';
import { prisma } from '../../database/prisma.js';
import { requireAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { ok } from '../../utils/api-response.js';

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);
notificationsRouter.get('/', asyncHandler(async (req, res) => ok(res, await prisma.notification.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' }, take: 50 }), 'Notifications')));
notificationsRouter.patch('/:id/read', asyncHandler(async (req, res) => ok(res, await prisma.notification.updateMany({ where: { id: req.params.id, userId: req.user!.id }, data: { readAt: new Date() } }), 'Notification marked read')));
