import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { created, ok } from '../../utils/api-response.js';
import { accessCookieMaxAgeMs, authCookieOptions, refreshCookieMaxAgeMs } from '../../auth/tokens.js';
import { requestIp } from '../../middleware/request-context.js';
import * as service from './auth.service.js';
import { UnauthorizedError } from '../../utils/errors.js';

function setAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string; csrfToken: string }) {
  res.cookie('accessToken', tokens.accessToken, authCookieOptions(accessCookieMaxAgeMs));
  res.cookie('refreshToken', tokens.refreshToken, authCookieOptions(refreshCookieMaxAgeMs));
  res.cookie('csrfToken', tokens.csrfToken, authCookieOptions(refreshCookieMaxAgeMs, false));
}

function clearAuthCookies(res: Response) {
  res.clearCookie('accessToken', authCookieOptions());
  res.clearCookie('refreshToken', authCookieOptions());
  res.clearCookie('csrfToken', authCookieOptions(undefined, false));
}

export const register = asyncHandler(async (req, res) => {
  const user = await service.register(req.body);
  return created(res, { user }, 'Registration successful');
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.login(req.body, { userAgent: req.headers['user-agent'], ipAddress: requestIp(req) });
  setAuthCookies(res, result);
  return ok(res, { user: result.user }, 'Login successful');
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new UnauthorizedError('Refresh token required');
  const result = await service.refresh(token);
  setAuthCookies(res, result);
  return ok(res, null, 'Session refreshed');
});

export const logout = asyncHandler(async (req, res) => {
  await service.logout(req.user?.sessionId);
  clearAuthCookies(res);
  return ok(res, null, 'Logged out');
});

export const me = asyncHandler(async (req, res) => ok(res, { user: req.user }, 'Current user'));

export const forgotPassword = asyncHandler(async (req, res) => {
  await service.forgotPassword(req.body.email);
  return ok(res, null, 'If the account exists, reset instructions will be sent');
});

export const resetPassword = asyncHandler(async (req, res) => {
  await service.resetPassword(req.body.token, req.body.password);
  return ok(res, null, 'Password reset successful');
});

export const verifyEmail = asyncHandler(async (req, res) => {
  await service.verifyEmail(req.body.token);
  return ok(res, null, 'Email verified');
});
