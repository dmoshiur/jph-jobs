import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  API_PREFIX: z.string().default('/api/v1'),
  DATABASE_URL: z.string().optional(),
  DIRECT_DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().min(16).default('dev-only-change-this-jwt-secret'),
  REFRESH_TOKEN_SECRET: z.string().min(16).default('dev-only-change-this-refresh-secret'),
  COOKIE_SECRET: z.string().min(8).default('dev-cookie-secret'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(30),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).optional(),
  PAYMENT_GATEWAY: z.string().default('sslcommerz'),
  PAYMENT_MERCHANT_ID: z.string().optional(),
  PAYMENT_API_KEY: z.string().optional(),
  PAYMENT_SECRET: z.string().optional(),
  PAYMENT_WEBHOOK_SECRET: z.string().optional(),
  PAYMENT_BASE_URL: z.string().optional(),
  BACKEND_PUBLIC_URL: z.string().url().optional(),
  CRON_SECRET: z.string().default('dev-cron-secret'),
  ROOT_ADMIN_EMAIL: z.string().email().default('root@jphjobs.local'),
  ROOT_ADMIN_PASSWORD: z.string().min(12).default('ChangeMeStrong123!')
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid backend environment', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration');
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
export const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean);

if (isProduction) {
  const unsafe = ['dev-only-change-this-jwt-secret', 'dev-only-change-this-refresh-secret', 'dev-cookie-secret'];
  if (unsafe.includes(env.JWT_SECRET) || unsafe.includes(env.REFRESH_TOKEN_SECRET) || unsafe.includes(env.COOKIE_SECRET)) {
    throw new Error('Production secrets must be configured with strong unique values');
  }
}
