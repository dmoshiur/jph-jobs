import type { NextFunction, Request, Response } from 'express';
import { firebaseAuth } from '../firebase/admin.js';
import { ensureUserProvisioned } from '../auth/user.js';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';

/**
 * Authentication is delegated to Firebase Auth. Clients obtain an ID token from
 * the Firebase Web SDK (email/password or Google) and send it as a Bearer token.
 * The backend verifies the token, provisions/loads the Firestore user document,
 * and attaches the resolved RBAC context to `req.user`.
 */

function extractToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  // Fallback for clients that still send a cookie.
  return req.cookies?.idToken;
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    if (!token) throw new UnauthorizedError();

    const decoded = await firebaseAuth().verifyIdToken(token).catch(() => null);
    if (!decoded) throw new UnauthorizedError('Invalid or expired token');

    const user = await ensureUserProvisioned(decoded as any);
    if (!user || ['DISABLED', 'DELETED', 'SUSPENDED'].includes(user.status)) {
      throw new UnauthorizedError('Account is not active');
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status as any,
      roles: user.roles,
      permissions: user.permissions
    };
    next();
  } catch (error) {
    next(error instanceof UnauthorizedError ? error : new UnauthorizedError());
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.headers.authorization && !req.cookies?.idToken) return next();
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
    if (!permissions.some((p) => req.user?.permissions.includes(p))) return next(new ForbiddenError('Missing required permission'));
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

/**
 * CSRF protection is no longer required: authentication uses stateless Bearer
 * ID tokens (not ambient cookies), so cross-site requests cannot ride on the
 * user's session. Retained as a no-op to preserve the middleware pipeline.
 */
export function csrfProtection(_req: Request, _res: Response, next: NextFunction) {
  next();
}
