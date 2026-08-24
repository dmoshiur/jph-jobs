import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors, { type CorsOptions } from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import type { Express } from 'express';
import { allowedOrigins, env, isProduction } from '../config/env.js';

export const corsOptions: CorsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (!origin && !isProduction) return callback(null, true);
    if (origin && allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS origin not allowed'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With']
};

export function applySecurity(app: Express) {
  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
  app.use(compression());
  app.use(cookieParser());
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 500, standardHeaders: 'draft-7', legacyHeaders: false }));
}

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts', errors: {} }
});
