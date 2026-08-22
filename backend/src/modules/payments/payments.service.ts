import { env } from '../../config/env.js';
import { prisma } from '../../database/prisma.js';
import { getPaymentGateway } from '../../payments/gateway-factory.js';
import { ApiError } from '../../utils/errors.js';

export async function createOrder(userId: string, input: { packageId: string; purpose: string; jobId?: string; metadata?: unknown }) {
  const [user, pkg] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.package.findUniqueOrThrow({ where: { id: input.packageId } })
  ]);
  if (!pkg.isActive) throw new ApiError(400, 'Package is not active');

  const order = await prisma.order.create({ data: { userId, packageId: pkg.id, purpose: input.purpose, amount: pkg.price, currency: pkg.currency, metadata: { ...((input.metadata as object) ?? {}), jobId: input.jobId } } });
  const payment = await prisma.payment.create({ data: { orderId: order.id, userId, provider: env.PAYMENT_GATEWAY, amount: order.amount, currency: order.currency, status: 'PENDING' } });
  const gateway = getPaymentGateway();
  const gatewayResult = await gateway.createPayment({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    customer: { name: user.name, email: user.email, phone: user.phone },
    callbackUrl: `${env.FRONTEND_URL}/dashboard/payments/${payment.id}`,
    webhookUrl: `${process.env.BACKEND_PUBLIC_URL ?? ''}/api/v1/payments/webhook/${gateway.name}`
  });
  await prisma.payment.update({ where: { id: payment.id }, data: { gatewayPayload: gatewayResult.raw as object | undefined } });
  return { order, paymentId: payment.id, checkoutUrl: gatewayResult.checkoutUrl };
}

export async function handleWebhook(provider: string, headers: Record<string, unknown>, body: unknown) {
  const gateway = getPaymentGateway(provider);
  const verified = await gateway.verifyWebhook(headers, body);
  if (!verified.valid) throw new ApiError(400, 'Invalid payment verification');

  const order = await prisma.order.findUnique({ where: { id: verified.orderId }, include: { payments: true, package: true } });
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.amount !== verified.amount || order.currency !== verified.currency) throw new ApiError(400, 'Payment amount mismatch');

  const existingSuccess = order.payments.find((payment: any) => payment.providerTransactionId === verified.transactionId && payment.status === 'SUCCESS');
  if (existingSuccess) return { payment: existingSuccess, duplicate: true };

  return prisma.$transaction(async (tx: any) => {
    const payment = await tx.payment.update({
      where: { id: order.payments[0]!.id },
      data: { providerTransactionId: verified.transactionId, status: verified.status === 'SUCCESS' ? 'SUCCESS' : verified.status, verifiedAt: verified.status === 'SUCCESS' ? new Date() : undefined, gatewayPayload: verified.raw as object | undefined }
    });

    if (verified.status === 'SUCCESS') {
      await tx.order.update({ where: { id: order.id }, data: { status: 'COMPLETED' } });
      await tx.invoice.upsert({
        where: { paymentId: payment.id },
        update: {},
        create: { paymentId: payment.id, number: `INV-${new Date().getFullYear()}-${payment.id.slice(-8).toUpperCase()}`, amount: payment.amount, currency: payment.currency, status: 'PAID' }
      });
      if (order.purpose === 'SUBSCRIPTION' && order.package?.durationDays) {
        await tx.subscription.create({ data: { userId: order.userId, packageId: order.package.id, startsAt: new Date(), endsAt: new Date(Date.now() + order.package.durationDays * 86400000) } });
      }
      await tx.notification.create({ data: { userId: order.userId, type: 'PAYMENT', title: 'Payment successful', body: 'Your payment has been verified.', data: { paymentId: payment.id, orderId: order.id } } });
      await tx.auditLog.create({ data: { action: 'payments.webhook.success', resource: 'payments', resourceId: payment.id, newValue: verified as object } });
    }
    return { payment, duplicate: false };
  });
}
