import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../database/prisma.js';
import { verifyAccessToken } from '../auth/tokens.js';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';
import { timingSafeEqual } from '../utils/security.js';

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const cookieToken = req.cookies?.accessToken;
    const header = req.headers.authorization;
    const bearerToken = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    const token = cookieToken || bearerToken;
    if (!token) throw new UnauthorizedError();

    const payload = verifyAccessToken(token);
    const session = await prisma.session.findFirst({ where: { id: payload.sessionId, userId: payload.sub, revokedAt: null, expiresAt: { gt: new Date() } } });
    if (!session) throw new UnauthorizedError('Session expired');

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } }
    });
    if (!user || ['DISABLED', 'DELETED', 'SUSPENDED'].includes(user.status)) throw new UnauthorizedError('Account is not active');

    const roles = user.roles.map((ur: any) => ur.role.slug) as string[];
    const permissions = [...new Set(user.roles.flatMap((ur: any) => ur.role.permissions.map((rp: any) => rp.permission.key)))] as string[];
    req.user = { id: user.id, email: user.email, name: user.name, status: user.status, roles, permissions, sessionId: session.id };
    next();
  } catch (error) {
    next(error instanceof UnauthorizedError ? error : new UnauthorizedError());
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.cookies?.accessToken && !req.headers.authorization) return next();
  return requireAuth(req, res, next);
}

export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new UnauthorizedError());
    if (req.user.roles.includes('root-admin')) return next();
    if (!req.user.permissions.includes(permission)) return next(new ForbiddenError(`Missing permission: ${permission}`));
    next();
  };
}

export function requireAnyPermission(permissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new UnauthorizedError());
    if (req.user.roles.includes('root-admin')) return next();
    if (!permissions.some((p) => req.user?.permissions.includes(p))) return next(new ForbiddenError(`Missing required permission`));
    next();
  };
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new UnauthorizedError());
    if (req.user.roles.includes('root-admin')) return next();
    if (!roles.some((role) => req.user?.roles.includes(role))) return next(new ForbiddenError('Missing role'));
    next();
  };
}

export function csrfProtection(req: Request, _res: Response, next: NextFunction) {
  if (!unsafeMethods.has(req.method)) return next();
  if (!req.cookies?.accessToken) return next();
  const cookieToken = req.cookies?.csrfToken;
  const headerToken = req.headers['x-csrf-token'];
  if (!cookieToken || typeof headerToken !== 'string') return next(new ForbiddenError('CSRF token missing'));
  if (!timingSafeEqual(cookieToken, headerToken)) return next(new ForbiddenError('CSRF token invalid'));
  next();
}
