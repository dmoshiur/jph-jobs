import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  API_PREFIX: z.string().default('/api/v1'),

  // ---- Firebase (Auth + Firestore + Realtime Database) ----
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  // Full service-account JSON as a single string (alternative to the 3 fields above).
  FIREBASE_SERVICE_ACCOUNT: z.string().optional(),
  // Realtime Database URL, e.g. https://<project>-default-rtdb.firebaseio.com
  FIREBASE_DATABASE_URL: z.string().optional(),
  // Emulator hosts (optional local dev).
  FIRESTORE_EMULATOR_HOST: z.string().optional(),
  FIREBASE_AUTH_EMULATOR_HOST: z.string().optional(),

  // ---- Cloudinary (image / file storage) ----
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // ---- App URLs / CORS ----
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),

  // ---- Payments ----
  PAYMENT_GATEWAY: z.string().default('sslcommerz'),
  PAYMENT_MERCHANT_ID: z.string().optional(),
  PAYMENT_API_KEY: z.string().optional(),
  PAYMENT_SECRET: z.string().optional(),
  PAYMENT_WEBHOOK_SECRET: z.string().optional(),
  PAYMENT_BASE_URL: z.string().optional(),
  BACKEND_PUBLIC_URL: z.string().url().optional(),

  CRON_SECRET: z.string().default('dev-cron-secret'),

  // ---- Root admin bootstrap ----
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

export const isFirebaseConfigured = Boolean(
  env.FIREBASE_SERVICE_ACCOUNT ||
    (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) ||
    env.FIRESTORE_EMULATOR_HOST
);

if (isProduction && !isFirebaseConfigured) {
  console.warn(
    'WARNING: Firebase credentials are not configured. Set FIREBASE_SERVICE_ACCOUNT ' +
      'or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY.'
  );
}
