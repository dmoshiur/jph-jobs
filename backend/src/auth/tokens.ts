import jwt, { type SignOptions } from 'jsonwebtoken';
import { env, isProduction } from '../config/env.js';
import { secureRandomToken } from '../utils/security.js';

export interface AccessTokenPayload { sub: string; sessionId: string; type: 'access'; }
export interface RefreshTokenPayload { sub: string; sessionId: string; nonce: string; type: 'refresh'; }

export function signAccessToken(userId: string, sessionId: string) {
  const options: SignOptions = { expiresIn: env.ACCESS_TOKEN_TTL as SignOptions['expiresIn'] };
  return jwt.sign({ sub: userId, sessionId, type: 'access' } satisfies AccessTokenPayload, env.JWT_SECRET, options);
}

export function signRefreshToken(userId: string, sessionId: string) {
  const payload: RefreshTokenPayload = { sub: userId, sessionId, nonce: secureRandomToken(16), type: 'refresh' };
  return jwt.sign(payload, env.REFRESH_TOKEN_SECRET, { expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d` });
}

export function verifyAccessToken(token: string) {
  const payload = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
  if (payload.type !== 'access') throw new Error('Invalid token type');
  return payload;
}

export function verifyRefreshToken(token: string) {
  const payload = jwt.verify(token, env.REFRESH_TOKEN_SECRET) as RefreshTokenPayload;
  if (payload.type !== 'refresh') throw new Error('Invalid token type');
  return payload;
}

export function authCookieOptions(maxAgeMs?: number, httpOnly = true) {
  const sameSite = env.COOKIE_SAME_SITE ?? (isProduction ? 'none' : 'lax');
  return {
    httpOnly,
    secure: isProduction || sameSite === 'none',
    sameSite: sameSite as 'lax' | 'strict' | 'none',
    domain: env.COOKIE_DOMAIN || undefined,
    path: '/',
    maxAge: maxAgeMs
  };
}

export const accessCookieMaxAgeMs = 15 * 60 * 1000;
export const refreshCookieMaxAgeMs = env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;
