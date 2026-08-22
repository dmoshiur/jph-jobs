export interface GatewayCreatePaymentInput {
  orderId: string;
  amount: number;
  currency: string;
  customer: { name: string; email: string; phone?: string | null };
  callbackUrl: string;
  webhookUrl: string;
}

export interface GatewayCreatePaymentResult {
  checkoutUrl: string;
  providerPaymentId?: string;
  raw?: unknown;
}

export interface GatewayWebhookVerificationResult {
  valid: boolean;
  transactionId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'PROCESSING';
  raw?: unknown;
}

export interface PaymentGatewayInterface {
  name: string;
  createPayment(input: GatewayCreatePaymentInput): Promise<GatewayCreatePaymentResult>;
  verifyWebhook(headers: Record<string, unknown>, body: unknown): Promise<GatewayWebhookVerificationResult>;
  verifyTransaction(transactionId: string): Promise<GatewayWebhookVerificationResult>;
}
