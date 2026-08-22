import { Router } from 'express';
import express from 'express';
import { prisma } from '../../database/prisma.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { created, ok } from '../../utils/api-response.js';
import { createOrderSchema } from './payments.validators.js';
import * as service from './payments.service.js';

export const paymentsRouter = Router();
paymentsRouter.post('/orders', requireAuth, validate(createOrderSchema), asyncHandler(async (req, res) => created(res, await service.createOrder(req.user!.id, req.body), 'Payment initialized')));
paymentsRouter.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  const canViewAll = req.user!.roles.includes('root-admin') || req.user!.permissions.includes('payments.view');
  const payment = await prisma.payment.findFirstOrThrow({
    where: canViewAll ? { id: req.params.id } : { id: req.params.id, userId: req.user!.id },
    include: { order: true, invoice: true }
  });
  return ok(res, payment, 'Payment status');
}));
paymentsRouter.post('/webhook/:provider', express.json({ type: '*/*' }), asyncHandler(async (req, res) => ok(res, await service.handleWebhook(req.params.provider, req.headers, req.body), 'Webhook processed')));
