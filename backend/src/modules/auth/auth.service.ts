import bcrypt from 'bcryptjs';
import { prisma } from '../../database/prisma.js';
import { ApiError, UnauthorizedError } from '../../utils/errors.js';
import { secureRandomToken, sha256 } from '../../utils/security.js';
import { signAccessToken, signRefreshToken } from '../../auth/tokens.js';
import { env } from '../../config/env.js';

interface SessionContext { userAgent?: string; ipAddress?: string; }

export function publicUser(user: { id: string; name: string; email: string; phone?: string | null; status: string; emailVerifiedAt?: Date | null }) {
  return { id: user.id, name: user.name, email: user.email, phone: user.phone, status: user.status, emailVerifiedAt: user.emailVerifiedAt };
}

export async function register(input: { name: string; email: string; phone?: string; password: string; accountType: 'candidate' | 'employer' }) {
  const exists = await prisma.user.findFirst({ where: { OR: [{ email: input.email }, ...(input.phone ? [{ phone: input.phone }] : [])] } });
  if (exists) throw new ApiError(409, 'User already exists');

  const roleSlug = input.accountType === 'employer' ? 'employer' : 'candidate';
  const passwordHash = await bcrypt.hash(input.password, 12);

  return prisma.$transaction(async (tx: any) => {
    const user = await tx.user.create({ data: { name: input.name, email: input.email, phone: input.phone, passwordHash, status: 'ACTIVE' } });
    const role = await tx.role.findUnique({ where: { slug: roleSlug } });
    if (role) await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
    if (roleSlug === 'candidate') await tx.candidateProfile.create({ data: { userId: user.id } });
    return publicUser(user);
  });
}

export async function login(input: { email: string; password: string }, ctx: SessionContext) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) throw new UnauthorizedError('Invalid email or password');
  if (['DISABLED', 'DELETED', 'SUSPENDED'].includes(user.status)) throw new UnauthorizedError('Account is not active');

  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  const session = await prisma.session.create({ data: { userId: user.id, refreshHash: secureRandomToken(), expiresAt, userAgent: ctx.userAgent, ipAddress: ctx.ipAddress } });
  const accessToken = signAccessToken(user.id, session.id);
  const refreshToken = signRefreshToken(user.id, session.id);
  await prisma.session.update({ where: { id: session.id }, data: { refreshHash: sha256(refreshToken) } });
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return { user: publicUser(user), accessToken, refreshToken, csrfToken: secureRandomToken(24) };
}

export async function refresh(rawRefreshToken: string) {
  const { verifyRefreshToken } = await import('../../auth/tokens.js');
  const payload = verifyRefreshToken(rawRefreshToken);
  const refreshHash = sha256(rawRefreshToken);
  const session = await prisma.session.findFirst({ where: { id: payload.sessionId, userId: payload.sub, refreshHash, revokedAt: null, expiresAt: { gt: new Date() } } });
  if (!session) throw new UnauthorizedError('Refresh token expired');

  const newRefreshToken = signRefreshToken(payload.sub, session.id);
  await prisma.session.update({ where: { id: session.id }, data: { refreshHash: sha256(newRefreshToken) } });
  return { accessToken: signAccessToken(payload.sub, session.id), refreshToken: newRefreshToken, csrfToken: secureRandomToken(24) };
}

export async function logout(sessionId?: string) {
  if (sessionId) await prisma.session.updateMany({ where: { id: sessionId }, data: { revokedAt: new Date() } });
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;
  const token = secureRandomToken(32);
  await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });
  // Integrate configured email provider here. Do not return token in production.
  if (process.env.NODE_ENV !== 'production') console.info(`Password reset token for ${email}: ${token}`);
}

export async function resetPassword(token: string, password: string) {
  const record = await prisma.passwordResetToken.findFirst({ where: { tokenHash: sha256(token), usedAt: null, expiresAt: { gt: new Date() } } });
  if (!record) throw new ApiError(400, 'Invalid or expired token');
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.session.updateMany({ where: { userId: record.userId }, data: { revokedAt: new Date() } })
  ]);
}

export async function verifyEmail(token: string) {
  const record = await prisma.emailVerificationToken.findFirst({ where: { tokenHash: sha256(token), usedAt: null, expiresAt: { gt: new Date() } } });
  if (!record) throw new ApiError(400, 'Invalid or expired token');
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date(), status: 'ACTIVE' } }),
    prisma.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } })
  ]);
}
