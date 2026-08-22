import crypto from 'node:crypto';
import { env } from '../config/env.js';
import type { GatewayCreatePaymentInput, GatewayCreatePaymentResult, GatewayWebhookVerificationResult, PaymentGatewayInterface } from './payment-gateway.interface.js';
import { ApiError } from '../utils/errors.js';

/**
 * SSLCommerz-compatible gateway adapter.
 * Production deployments should set real provider URLs/secrets. The adapter deliberately does not accept frontend success flags.
 */
export class SSLCommerzGateway implements PaymentGatewayInterface {
  name = 'sslcommerz';

  async createPayment(input: GatewayCreatePaymentInput): Promise<GatewayCreatePaymentResult> {
    if (!env.PAYMENT_BASE_URL || !env.PAYMENT_MERCHANT_ID || !env.PAYMENT_API_KEY || !env.PAYMENT_SECRET) {
      throw new ApiError(503, 'Payment gateway is not configured');
    }

    const response = await fetch(`${env.PAYMENT_BASE_URL}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': env.PAYMENT_API_KEY },
      body: JSON.stringify({
        merchantId: env.PAYMENT_MERCHANT_ID,
        orderId: input.orderId,
        amount: input.amount / 100,
        currency: input.currency,
        customer: input.customer,
        callbackUrl: input.callbackUrl,
        webhookUrl: input.webhookUrl
      })
    });

    if (!response.ok) throw new ApiError(502, 'Failed to initialize payment gateway');
    const data = await response.json() as { checkoutUrl?: string; paymentId?: string };
    if (!data.checkoutUrl) throw new ApiError(502, 'Gateway did not return checkout URL');
    return { checkoutUrl: data.checkoutUrl, providerPaymentId: data.paymentId, raw: data };
  }

  async verifyWebhook(headers: Record<string, unknown>, body: any): Promise<GatewayWebhookVerificationResult> {
    const signature = headers['x-payment-signature'];
    if (typeof signature !== 'string') throw new ApiError(401, 'Missing payment signature');
    const expected = crypto.createHmac('sha256', env.PAYMENT_WEBHOOK_SECRET || env.PAYMENT_SECRET || '').update(JSON.stringify(body)).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new ApiError(401, 'Invalid payment signature');
    return this.verifyTransaction(String(body.transactionId));
  }

  async verifyTransaction(transactionId: string): Promise<GatewayWebhookVerificationResult> {
    if (!env.PAYMENT_BASE_URL || !env.PAYMENT_API_KEY) throw new ApiError(503, 'Payment gateway verification is not configured');
    const response = await fetch(`${env.PAYMENT_BASE_URL}/transactions/${encodeURIComponent(transactionId)}/verify`, { headers: { 'X-API-Key': env.PAYMENT_API_KEY } });
    if (!response.ok) throw new ApiError(502, 'Gateway transaction verification failed');
    const data = await response.json() as any;
    return {
      valid: Boolean(data.valid),
      transactionId: String(data.transactionId),
      orderId: String(data.orderId),
      amount: Math.round(Number(data.amount) * 100),
      currency: String(data.currency || 'BDT'),
      status: data.status,
      raw: data
    };
  }
}
