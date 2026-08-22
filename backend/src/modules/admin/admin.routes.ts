import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../../database/prisma.js';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { created, ok } from '../../utils/api-response.js';
import { ApiError, ForbiddenError } from '../../utils/errors.js';
import { audit } from '../audit/audit.service.js';

export const adminRouter = Router();
adminRouter.use(requireAuth);

adminRouter.get('/analytics', requirePermission('analytics.view'), asyncHandler(async (_req, res) => {
  const [totalUsers, candidates, employers, companies, activeJobs, applications, revenue, successfulPayments, totalPayments, popularLocations, popularCategories] = await Promise.all([
    prisma.user.count(),
    prisma.userRole.count({ where: { role: { slug: 'candidate' } } }),
    prisma.userRole.count({ where: { role: { slug: 'employer' } } }),
    prisma.company.count(),
    prisma.job.count({ where: { status: { in: ['APPROVED', 'PUBLISHED'] } } }),
    prisma.application.count(),
    prisma.payment.aggregate({ where: { status: 'SUCCESS' }, _sum: { amount: true } }),
    prisma.payment.count({ where: { status: 'SUCCESS' } }),
    prisma.payment.count(),
    prisma.job.groupBy({ by: ['districtId'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 5 }),
    prisma.job.groupBy({ by: ['categoryId'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 5 })
  ]);
  return ok(res, { totalUsers, candidates, employers, companies, activeJobs, applications, revenue: revenue._sum.amount ?? 0, paymentSuccessRate: totalPayments ? successfulPayments / totalPayments : 0, popularLocations, popularCategories }, 'Analytics');
}));

adminRouter.get('/users', requirePermission('users.view'), asyncHandler(async (_req, res) => ok(res, await prisma.user.findMany({ include: { roles: { include: { role: true } } }, orderBy: { createdAt: 'desc' }, take: 100 }), 'Users')));
adminRouter.patch('/users/:id/status', requirePermission('users.edit'), validate(z.object({ params: z.object({ id: z.string() }), body: z.object({ status: z.enum(['ACTIVE','PENDING','SUSPENDED','DISABLED']) }) })), asyncHandler(async (req, res) => {
  const target = await prisma.user.findUniqueOrThrow({ where: { id: req.params.id }, include: { roles: { include: { role: true } } } });
  if (target.roles.some((ur: any) => ur.role.slug === 'root-admin') && !req.user!.roles.includes('root-admin')) throw new ForbiddenError('Only Root Admin can modify Root Admin');
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { status: req.body.status } });
  await audit(req, { action: 'users.status', resource: 'users', resourceId: user.id, oldValue: target, newValue: user });
  return ok(res, user, 'User status updated');
}));

adminRouter.get('/jobs', requirePermission('jobs.view'), asyncHandler(async (_req, res) => ok(res, await prisma.job.findMany({ include: { company: true, creator: true }, orderBy: { createdAt: 'desc' }, take: 100 }), 'Admin jobs')));
adminRouter.patch('/jobs/:id/status', requirePermission('jobs.approve'), validate(z.object({ params: z.object({ id: z.string() }), body: z.object({ status: z.enum(['APPROVED','REJECTED','PUBLISHED','CLOSED','EXPIRED']) }) })), asyncHandler(async (req, res) => {
  const old = await prisma.job.findUniqueOrThrow({ where: { id: req.params.id } });
  const job = await prisma.job.update({ where: { id: req.params.id }, data: { status: req.body.status, publishedAt: ['APPROVED','PUBLISHED'].includes(req.body.status) ? new Date() : undefined } });
  await audit(req, { action: 'jobs.status', resource: 'jobs', resourceId: job.id, oldValue: old, newValue: job });
  return ok(res, job, 'Job status updated');
}));

adminRouter.get('/companies', requirePermission('companies.view'), asyncHandler(async (_req, res) => ok(res, await prisma.company.findMany({ include: { owner: true }, orderBy: { createdAt: 'desc' }, take: 100 }), 'Admin companies')));
adminRouter.patch('/companies/:id/verification', requirePermission('companies.verify'), validate(z.object({ params: z.object({ id: z.string() }), body: z.object({ verificationStatus: z.enum(['PENDING','VERIFIED','REJECTED','SUSPENDED']) }) })), asyncHandler(async (req, res) => {
  const old = await prisma.company.findUniqueOrThrow({ where: { id: req.params.id } });
  const company = await prisma.company.update({ where: { id: req.params.id }, data: { verificationStatus: req.body.verificationStatus } });
  await audit(req, { action: 'companies.verify', resource: 'companies', resourceId: company.id, oldValue: old, newValue: company });
  return ok(res, company, 'Company verification updated');
}));

adminRouter.get('/payments', requirePermission('payments.view'), asyncHandler(async (_req, res) => ok(res, await prisma.payment.findMany({ include: { user: true, order: true, invoice: true }, orderBy: { createdAt: 'desc' }, take: 100 }), 'Payments')));
adminRouter.get('/audit-logs', requirePermission('audit_logs.view'), asyncHandler(async (_req, res) => ok(res, await prisma.auditLog.findMany({ include: { admin: true }, orderBy: { createdAt: 'desc' }, take: 200 }), 'Audit logs')));

adminRouter.post('/admins/super-admins', requirePermission('admins.create'), validate(z.object({ body: z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(12) }) })), asyncHandler(async (req, res) => {
  if (!req.user!.roles.includes('root-admin')) throw new ForbiddenError('Only Root Admin can create Super Admins');
  const role = await prisma.role.findUnique({ where: { slug: 'super-admin' } });
  if (!role) throw new ApiError(500, 'Super Admin role not seeded');
  const user = await prisma.user.create({ data: { name: req.body.name, email: req.body.email.toLowerCase(), passwordHash: await bcrypt.hash(req.body.password, 12), status: 'ACTIVE', roles: { create: { roleId: role.id } } } });
  await audit(req, { action: 'admins.create_super_admin', resource: 'users', resourceId: user.id, newValue: { email: user.email } });
  return created(res, { id: user.id, email: user.email, name: user.name }, 'Super Admin created');
}));

adminRouter.delete('/admins/:id', requirePermission('admins.delete'), asyncHandler(async (req, res) => {
  if (!req.user!.roles.includes('root-admin')) throw new ForbiddenError('Only Root Admin can remove Super Admins');
  const target = await prisma.user.findUniqueOrThrow({ where: { id: req.params.id }, include: { roles: { include: { role: true } } } });
  if (target.roles.some((ur: any) => ur.role.slug === 'root-admin')) throw new ForbiddenError('Root Admin cannot be deleted');
  await prisma.user.update({ where: { id: target.id }, data: { status: 'DISABLED' } });
  await audit(req, { action: 'admins.disable', resource: 'users', resourceId: target.id, oldValue: target });
  return ok(res, null, 'Admin disabled');
}));

adminRouter.get('/roles', requirePermission('admins.view'), asyncHandler(async (_req, res) => ok(res, await prisma.role.findMany({ include: { permissions: { include: { permission: true } } } }), 'Roles')));
adminRouter.get('/permissions', requirePermission('admins.view'), asyncHandler(async (_req, res) => ok(res, await prisma.permission.findMany({ orderBy: { key: 'asc' } }), 'Permissions')));
adminRouter.get('/settings', requirePermission('settings.view'), asyncHandler(async (_req, res) => ok(res, await prisma.setting.findMany({ where: { isSecret: false } }), 'Settings')));
adminRouter.patch('/settings/:key', requirePermission('settings.edit'), validate(z.object({ params: z.object({ key: z.string() }), body: z.object({ value: z.unknown(), isSecret: z.boolean().optional() }) })), asyncHandler(async (req, res) => {
  const setting = await prisma.setting.upsert({ where: { key: req.params.key }, update: { value: req.body.value, isSecret: req.body.isSecret ?? false, updatedById: req.user!.id }, create: { key: req.params.key, value: req.body.value, isSecret: req.body.isSecret ?? false, updatedById: req.user!.id } });
  await audit(req, { action: 'settings.edit', resource: 'settings', resourceId: setting.id, newValue: { key: setting.key } });
  return ok(res, setting, 'Setting saved');
}));
