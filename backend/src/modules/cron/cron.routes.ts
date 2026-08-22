import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../../config/env.js';
import { prisma } from '../../database/prisma.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { ok } from '../../utils/api-response.js';
import { UnauthorizedError } from '../../utils/errors.js';

function requireCron(req: Request, _res: Response, next: NextFunction) {
  if (req.headers.authorization !== `Bearer ${env.CRON_SECRET}`) return next(new UnauthorizedError('Invalid cron secret'));
  next();
}

export const cronRouter = Router();
cronRouter.use(requireCron);
cronRouter.get('/expire-jobs', asyncHandler(async (_req, res) => {
  const result = await prisma.job.updateMany({ where: { deadline: { lt: new Date() }, status: { in: ['APPROVED', 'PUBLISHED'] } }, data: { status: 'EXPIRED' } });
  return ok(res, result, 'Expired jobs processed');
}));
cronRouter.get('/payment-reconciliation', asyncHandler(async (_req, res) => {
  // Provider reconciliation can safely run here using PaymentGatewayInterface.verifyTransaction for stale PROCESSING records.
  const pending = await prisma.payment.count({ where: { status: { in: ['PENDING', 'PROCESSING'] } } });
  return ok(res, { pending }, 'Payment reconciliation inspected');
}));
