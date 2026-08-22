import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { isProduction } from '../config/env.js';
import { ApiError } from '../utils/errors.js';

export const notFound: ErrorRequestHandler = (err, _req, res, next) => {
  next(err);
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(422).json({ success: false, message: 'Validation failed', errors: err.flatten() });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ success: false, message: err.message, errors: err.errors });
  }

  const message = isProduction ? 'Something went wrong' : err?.message || 'Something went wrong';
  const errors = isProduction ? {} : { stack: err?.stack };
  return res.status(500).json({ success: false, message, errors });
};
