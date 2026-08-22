import type { Response } from 'express';

export function ok<T>(res: Response, data: T, message = 'Success', status = 200) {
  return res.status(status).json({ success: true, message, data });
}

export function created<T>(res: Response, data: T, message = 'Created') {
  return ok(res, data, message, 201);
}

export function fail(res: Response, message = 'Something went wrong', errors: unknown = {}, status = 400) {
  return res.status(status).json({ success: false, message, errors });
}
