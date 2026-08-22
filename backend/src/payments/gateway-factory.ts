import { env } from '../config/env.js';
import type { PaymentGatewayInterface } from './payment-gateway.interface.js';
import { SSLCommerzGateway } from './sslcommerz.gateway.js';

export function getPaymentGateway(provider = env.PAYMENT_GATEWAY): PaymentGatewayInterface {
  switch (provider.toLowerCase()) {
    case 'sslcommerz':
    case 'bkash':
    case 'nagad':
      // bKash/Nagad can be introduced without changing order/job logic by implementing PaymentGatewayInterface.
      return new SSLCommerzGateway();
    default:
      throw new Error(`Unsupported payment gateway: ${provider}`);
  }
}
