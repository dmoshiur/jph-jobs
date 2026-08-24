import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../database/prisma.js';
import { createAuthUser } from '../../auth/user.js';
import { requireAuth, requirePermission } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { created, ok } from '../../utils/api-response.js';
import { ApiError, ForbiddenError } from '../../utils/errors.js';
import { audit } from '../audit/audit.service.js';
import { createNotification, createNotifications } from '../notifications/notifications.service.js';

export const adminRouter = Router();
adminRouter.use(requireAuth);

// ---------- Dashboard analytics ----------
adminRouter.get('/analytics', requirePermission('analytics.view'), asyncHandler(async (_req, res) => {
  const [totalUsers, candidates, employers, companies, businesses, activeJobs, pendingJobs, applications, revenue, successfulPayments, totalPayments, popularLocations, popularCategories] = await Promise.all([
    prisma.user.count(),
    prisma.userRole.count({ where: { role: { slug: 'candidate' } } }),
    prisma.userRole.count({ where: { role: { slug: 'employer' } } }),
    prisma.company.count(),
    prisma.businessListing.count(),
    prisma.job.count({ where: { status: { in: ['APPROVED', 'PUBLISHED'] }, deadline: { gt: new Date() } } }),
    prisma.job.count({ where: { status: 'PENDING_REVIEW' } }),
    prisma.application.count(),
    prisma.payment.aggregate({ where: { status: 'SUCCESS' }, _sum: { amount: true } }),
    prisma.payment.count({ where: { status: 'SUCCESS' } }),
    prisma.payment.count(),
    prisma.job.groupBy({ by: ['districtId'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 5 }),
    prisma.job.groupBy({ by: ['categoryId'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 5 })
  ]);
  return ok(res, {
    totalUsers, candidates, employers, companies, businesses, activeJobs, pendingJobs, applications,
    revenue: revenue._sum.amount ?? 0,
    paymentSuccessRate: totalPayments ? successfulPayments / totalPayments : 0,
    popularLocations, popularCategories
  }, 'Analytics');
}));

// ---------- Users ----------
const listQuery = z.object({ query: z.object({ q: z.string().optional(), role: z.string().optional(), status: z.string().optional(), page: z.coerce.number().min(1).default(1), limit: z.coerce.number().min(1).max(100).default(20) }) });

adminRouter.get('/users', requirePermission('users.view'), validate(listQuery), asyncHandler(async (req, res) => {
  const q = req.query as any;
  const where: any = {};
  if (q.q) where.OR = [{ name: { contains: q.q, mode: 'insensitive' } }, { email: { contains: q.q, mode: 'insensitive' } }, { phone: { contains: q.q } }];
  if (q.status) where.status = q.status;
  if (q.role) where.roles = { some: { role: { slug: q.role } } };
  const [items, total] = await Promise.all([
    prisma.user.findMany({ where, include: { roles: { include: { role: true } } }, orderBy: { createdAt: 'desc' }, skip: (q.page - 1) * q.limit, take: q.limit }),
    prisma.user.count({ where })
  ]);
  return ok(res, { items, total, page: q.page, limit: q.limit, pages: Math.ceil(total / q.limit) }, 'Users');
}));

adminRouter.patch('/users/:id/status', requirePermission('users.edit'),
  validate(z.object({ params: z.object({ id: z.string() }), body: z.object({ status: z.enum(['ACTIVE', 'PENDING', 'SUSPENDED', 'DISABLED']) }) })),
  asyncHandler(async (req, res) => {
    const target = await prisma.user.findUniqueOrThrow({ where: { id: req.params.id }, include: { roles: { include: { role: true } } } });
    if (target.roles.some((ur: any) => ur.role.slug === 'root-admin') && !req.user!.roles.includes('root-admin')) throw new ForbiddenError('Only Root Admin can modify Root Admin');
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { status: req.body.status } });
    // Mirror the account state in Firebase Auth (disabled users cannot sign in).
    const { firebaseAuth } = await import('../../firebase/admin.js');
    await firebaseAuth().updateUser(user.id, { disabled: ['SUSPENDED', 'DISABLED'].includes(req.body.status) }).catch(() => undefined);
    await audit(req, { action: 'users.status', resource: 'users', resourceId: user.id, oldValue: { status: target.status }, newValue: { status: user.status } });
    return ok(res, user, 'User status updated');
  }));

// ---------- Jobs ----------
adminRouter.get('/jobs', requirePermission('jobs.view'), validate(listQuery), asyncHandler(async (req, res) => {
  const q = req.query as any;
  const where: any = {};
  if (q.q) where.title = { contains: q.q, mode: 'insensitive' };
  if (q.status) where.status = q.status;
  const [items, total] = await Promise.all([
    prisma.job.findMany({ where, include: { company: true, creator: true, category: true }, orderBy: { createdAt: 'desc' }, skip: (q.page - 1) * q.limit, take: q.limit }),
    prisma.job.count({ where })
  ]);
  return ok(res, { items, total, page: q.page, limit: q.limit, pages: Math.ceil(total / q.limit) }, 'Admin jobs');
}));

adminRouter.patch('/jobs/:id/status', requirePermission('jobs.approve'),
  validate(z.object({ params: z.object({ id: z.string() }), body: z.object({ status: z.enum(['APPROVED', 'REJECTED', 'PUBLISHED', 'CLOSED', 'EXPIRED', 'PENDING_REVIEW']) }) })),
  asyncHandler(async (req, res) => {
    const old = await prisma.job.findUniqueOrThrow({ where: { id: req.params.id } });
    const publishing = ['APPROVED', 'PUBLISHED'].includes(req.body.status);
    const job = await prisma.job.update({
      where: { id: req.params.id },
      data: { status: req.body.status, publishedAt: publishing && !old.publishedAt ? new Date() : old.publishedAt }
    });
    await createNotification({ userId: job.creatorId, type: 'JOB', title: publishing ? 'আপনার চাকরি প্রকাশিত হয়েছে' : 'চাকরির স্ট্যাটাস আপডেট', body: `আপনার "${job.title}" চাকরিটি ${publishing ? 'অনুমোদিত ও প্রকাশিত' : req.body.status} হয়েছে।`, data: { jobId: job.id, status: req.body.status } });
    await audit(req, { action: 'jobs.status', resource: 'jobs', resourceId: job.id, oldValue: { status: old.status }, newValue: { status: job.status } });
    return ok(res, job, 'Job status updated');
  }));

// ---------- Companies ----------
adminRouter.get('/companies', requirePermission('companies.view'), validate(listQuery), asyncHandler(async (req, res) => {
  const q = req.query as any;
  const where: any = {};
  if (q.q) where.name = { contains: q.q, mode: 'insensitive' };
  if (q.status) where.verificationStatus = q.status;
  const [items, total] = await Promise.all([
    prisma.company.findMany({ where, include: { owner: true, district: true }, orderBy: { createdAt: 'desc' }, skip: (q.page - 1) * q.limit, take: q.limit }),
    prisma.company.count({ where })
  ]);
  return ok(res, { items, total, page: q.page, limit: q.limit, pages: Math.ceil(total / q.limit) }, 'Companies');
}));

adminRouter.patch('/companies/:id/verification', requirePermission('companies.verify'),
  validate(z.object({ params: z.object({ id: z.string() }), body: z.object({ verificationStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED']) }) })),
  asyncHandler(async (req, res) => {
    const old = await prisma.company.findUniqueOrThrow({ where: { id: req.params.id } });
    const company = await prisma.company.update({ where: { id: req.params.id }, data: { verificationStatus: req.body.verificationStatus } });
    await createNotification({ userId: company.ownerId, type: 'COMPANY', title: 'কোম্পানি ভেরিফিকেশন আপডেট', body: `আপনার কোম্পানি "${company.name}"-${req.body.verificationStatus === 'VERIFIED' ? 'ভেরিফাইড হয়েছে' : 'স্ট্যাটাস আপডেট হয়েছে'}।`, data: { companyId: company.id, status: req.body.verificationStatus } });
    await audit(req, { action: 'companies.verify', resource: 'companies', resourceId: company.id, oldValue: { verificationStatus: old.verificationStatus }, newValue: { verificationStatus: company.verificationStatus } });
    return ok(res, company, 'Company verification updated');
  }));

// ---------- Businesses ----------
adminRouter.get('/businesses', requirePermission('businesses.view'), validate(listQuery), asyncHandler(async (req, res) => {
  const q = req.query as any;
  const where: any = {};
  if (q.q) where.name = { contains: q.q, mode: 'insensitive' };
  const [items, total] = await Promise.all([
    prisma.businessListing.findMany({ where, include: { district: true }, orderBy: { createdAt: 'desc' }, skip: (q.page - 1) * q.limit, take: q.limit }),
    prisma.businessListing.count({ where })
  ]);
  return ok(res, { items, total, page: q.page, limit: q.limit, pages: Math.ceil(total / q.limit) }, 'Businesses');
}));

adminRouter.patch('/businesses/:id/verify', requirePermission('businesses.verify'),
  validate(z.object({ params: z.object({ id: z.string() }), body: z.object({ isVerified: z.boolean() }) })),
  asyncHandler(async (req, res) => ok(res, await prisma.businessListing.update({ where: { id: req.params.id }, data: { isVerified: req.body.isVerified } }), 'Business updated')));

// ---------- Applications ----------
adminRouter.get('/applications', requirePermission('applications.view'), asyncHandler(async (_req, res) =>
  ok(res, await prisma.application.findMany({ include: { job: { include: { company: true } }, candidate: true }, orderBy: { createdAt: 'desc' }, take: 200 }), 'Applications')));

// ---------- Payments / orders / invoices ----------
adminRouter.get('/payments', requirePermission('payments.view'), asyncHandler(async (_req, res) =>
  ok(res, await prisma.payment.findMany({ include: { user: true, order: { include: { package: true } }, invoice: true }, orderBy: { createdAt: 'desc' }, take: 200 }), 'Payments')));

adminRouter.get('/orders', requirePermission('payments.view'), asyncHandler(async (_req, res) =>
  ok(res, await prisma.order.findMany({ include: { user: true, package: true, payments: true }, orderBy: { createdAt: 'desc' }, take: 200 }), 'Orders')));

adminRouter.get('/invoices', requirePermission('payments.view'), asyncHandler(async (_req, res) =>
  ok(res, await prisma.invoice.findMany({ include: { payment: { include: { user: true, order: true } } }, orderBy: { issuedAt: 'desc' }, take: 200 }), 'Invoices')));

adminRouter.post('/payments/:id/refund', requirePermission('payments.refund'), asyncHandler(async (req, res) => {
  const old = await prisma.payment.findUniqueOrThrow({ where: { id: req.params.id } });
  const payment = await prisma.$transaction(async (tx: any) => {
    const p = await tx.payment.update({ where: { id: old.id }, data: { status: 'REFUNDED' } });
    if (p.orderId) await tx.order.update({ where: { id: p.orderId }, data: { status: 'CANCELLED' } });
    await tx.invoice.updateMany({ where: { paymentId: p.id }, data: { status: 'REFUNDED' } });
    return p;
  });
  await audit(req, { action: 'payments.refund', resource: 'payments', resourceId: payment.id, oldValue: { status: old.status }, newValue: { status: payment.status } });
  return ok(res, payment, 'Payment refunded');
}));

// ---------- Packages ----------
adminRouter.get('/packages', requirePermission('packages.view'), asyncHandler(async (_req, res) =>
  ok(res, await prisma.package.findMany({ include: { features: true }, orderBy: { sortOrder: 'asc' } }), 'Packages')));

adminRouter.post('/packages', requirePermission('packages.edit'),
  validate(z.object({ body: z.object({
    name: z.string().min(2), slug: z.string().min(2), type: z.enum(['JOB', 'SUBSCRIPTION', 'ADVERTISEMENT']),
    price: z.number().int().nonnegative(), currency: z.string().default('BDT'), durationDays: z.number().int().optional(),
    isActive: z.boolean().default(true), sortOrder: z.number().int().default(0), features: z.record(z.string()).optional()
  }) })),
  asyncHandler(async (req, res) => {
    const { features, ...data } = req.body;
    const pkg = await prisma.package.create({ data: { ...data, features: features ? { create: Object.entries(features).map(([key, value]) => ({ key, value: String(value) })) } : undefined }, include: { features: true } });
    await audit(req, { action: 'packages.create', resource: 'packages', resourceId: pkg.id });
    return created(res, pkg, 'Package created');
  }));

adminRouter.patch('/packages/:id', requirePermission('packages.edit'),
  validate(z.object({ params: z.object({ id: z.string() }), body: z.object({
    name: z.string().optional(), price: z.number().int().nonnegative().optional(), durationDays: z.number().int().optional(),
    isActive: z.boolean().optional(), sortOrder: z.number().int().optional()
  }) })),
  asyncHandler(async (req, res) => ok(res, await prisma.package.update({ where: { id: req.params.id }, data: req.body }), 'Package updated')));

// ---------- Categories ----------
adminRouter.get('/categories', requirePermission('categories.view'), asyncHandler(async (_req, res) =>
  ok(res, await prisma.jobCategory.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { jobs: true } } } }), 'Categories')));

adminRouter.post('/categories', requirePermission('categories.edit'),
  validate(z.object({ body: z.object({ name: z.string().min(2), description: z.string().optional(), isActive: z.boolean().default(true) }) })),
  asyncHandler(async (req, res) => created(res, await prisma.jobCategory.create({ data: { name: req.body.name, slug: req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''), description: req.body.description, isActive: req.body.isActive } }), 'Category created')));

// ---------- Locations ----------
adminRouter.get('/locations', requirePermission('locations.view'), asyncHandler(async (_req, res) =>
  ok(res, await prisma.location.findMany({ orderBy: { name: 'asc' }, include: { parent: true } }), 'Locations')));

adminRouter.post('/locations', requirePermission('locations.edit'),
  validate(z.object({ body: z.object({ name: z.string().min(2), type: z.enum(['COUNTRY', 'DIVISION', 'DISTRICT', 'UPAZILA', 'UNION', 'AREA']), parentId: z.string().optional(), isActive: z.boolean().default(true) }) })),
  asyncHandler(async (req, res) => created(res, await prisma.location.create({ data: { name: req.body.name, slug: `${req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now().toString(36)}`, type: req.body.type, parentId: req.body.parentId, isActive: req.body.isActive } }), 'Location created')));

// ---------- Advertisements / reports / reviews ----------
adminRouter.get('/reports', requirePermission('reports.view'), asyncHandler(async (_req, res) =>
  ok(res, await prisma.report.findMany({ include: { reporter: { select: { name: true, email: true } } }, orderBy: { createdAt: 'desc' }, take: 200 }), 'Reports')));
adminRouter.patch('/reports/:id/status', requirePermission('reports.edit'),
  validate(z.object({ params: z.object({ id: z.string() }), body: z.object({ status: z.enum(['OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED']) }) })),
  asyncHandler(async (req, res) => ok(res, await prisma.report.update({ where: { id: req.params.id }, data: { status: req.body.status } }), 'Report updated')));

adminRouter.get('/reviews', requirePermission('reviews.view'), asyncHandler(async (_req, res) =>
  ok(res, await prisma.review.findMany({ include: { user: { select: { name: true } }, company: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 200 }), 'Reviews')));
adminRouter.patch('/reviews/:id/status', requirePermission('reviews.edit'),
  validate(z.object({ params: z.object({ id: z.string() }), body: z.object({ status: z.enum(['PENDING', 'APPROVED', 'REJECTED']) }) })),
  asyncHandler(async (req, res) => ok(res, await prisma.review.update({ where: { id: req.params.id }, data: { status: req.body.status } }), 'Review updated')));

// ---------- Admins / roles / permissions ----------
adminRouter.get('/admins', requirePermission('admins.view'), asyncHandler(async (_req, res) => {
  const admins = await prisma.user.findMany({
    where: { roles: { some: { role: { slug: { in: ['super-admin', 'root-admin'] } } } } },
    include: { roles: { include: { role: true } } }, orderBy: { createdAt: 'desc' }
  });
  return ok(res, admins, 'Admins');
}));

adminRouter.post('/admins/super-admins', requirePermission('admins.create'),
  validate(z.object({ body: z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(12) }) })),
  asyncHandler(async (req, res) => {
    if (!req.user!.roles.includes('root-admin')) throw new ForbiddenError('Only Root Admin can create Super Admins');
    const role = await prisma.role.findUnique({ where: { slug: 'super-admin' } });
    if (!role) throw new ApiError(500, 'Super Admin role not seeded');
    const exists = await prisma.user.findUnique({ where: { email: req.body.email.toLowerCase() } });
    if (exists) throw new ApiError(409, 'Email already in use');
    const user = await createAuthUser({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      roleSlugs: ['super-admin'],
      status: 'ACTIVE',
      emailVerified: true
    });
    await audit(req, { action: 'admins.create_super_admin', resource: 'users', resourceId: user.id, newValue: { email: user.email } });
    return created(res, { id: user.id, email: user.email, name: user.name }, 'Super Admin created');
  }));

adminRouter.delete('/admins/:id', requirePermission('admins.delete'), asyncHandler(async (req, res) => {
  if (!req.user!.roles.includes('root-admin')) throw new ForbiddenError('Only Root Admin can remove Super Admins');
  const target = await prisma.user.findUniqueOrThrow({ where: { id: req.params.id }, include: { roles: { include: { role: true } } } });
  if (target.roles.some((ur: any) => ur.role.slug === 'root-admin')) throw new ForbiddenError('Root Admin cannot be deleted');
  await prisma.user.update({ where: { id: target.id }, data: { status: 'DISABLED' } });
  const { firebaseAuth } = await import('../../firebase/admin.js');
  await firebaseAuth().updateUser(target.id, { disabled: true }).catch(() => undefined);
  await audit(req, { action: 'admins.disable', resource: 'users', resourceId: target.id });
  return ok(res, null, 'Admin disabled');
}));

adminRouter.get('/roles', requirePermission('admins.view'), asyncHandler(async (_req, res) =>
  ok(res, await prisma.role.findMany({ include: { permissions: { include: { permission: true } } } }), 'Roles')));
adminRouter.get('/permissions', requirePermission('admins.view'), asyncHandler(async (_req, res) =>
  ok(res, await prisma.permission.findMany({ orderBy: { key: 'asc' } }), 'Permissions')));

// ---------- Settings & audit ----------
adminRouter.get('/settings', requirePermission('settings.view'), asyncHandler(async (_req, res) =>
  ok(res, await prisma.setting.findMany({ where: { isSecret: false } }), 'Settings')));
adminRouter.patch('/settings/:key', requirePermission('settings.edit'),
  validate(z.object({ params: z.object({ key: z.string() }), body: z.object({ value: z.unknown(), isSecret: z.boolean().optional() }) })),
  asyncHandler(async (req, res) => {
    const setting = await prisma.setting.upsert({ where: { key: req.params.key }, update: { value: req.body.value, isSecret: req.body.isSecret ?? false, updatedById: req.user!.id }, create: { key: req.params.key, value: req.body.value, isSecret: req.body.isSecret ?? false, updatedById: req.user!.id } });
    await audit(req, { action: 'settings.edit', resource: 'settings', resourceId: setting.id, newValue: { key: setting.key } });
    return ok(res, setting, 'Setting saved');
  }));

adminRouter.get('/audit-logs', requirePermission('audit_logs.view'), validate(z.object({ query: z.object({ page: z.coerce.number().min(1).default(1), limit: z.coerce.number().min(1).max(200).default(50) }) })), asyncHandler(async (req, res) => {
  const q = req.query as any;
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({ include: { admin: { select: { name: true, email: true } } }, orderBy: { createdAt: 'desc' }, skip: (q.page - 1) * q.limit, take: q.limit }),
    prisma.auditLog.count()
  ]);
  return ok(res, { items, total, page: q.page, limit: q.limit, pages: Math.ceil(total / q.limit) }, 'Audit logs');
}));

// ---------- Notifications (broadcast) ----------
adminRouter.post('/notifications/broadcast', requirePermission('notifications.edit'),
  validate(z.object({ body: z.object({ title: z.string().min(2), body: z.string().min(2), audience: z.enum(['all', 'candidates', 'employers']).default('all') }) })),
  asyncHandler(async (req, res) => {
    const roleSlug = req.body.audience === 'candidates' ? 'candidate' : req.body.audience === 'employers' ? 'employer' : null;
    const users = await prisma.user.findMany({ where: roleSlug ? { roles: { some: { role: { slug: roleSlug } } }, status: 'ACTIVE' } : { status: 'ACTIVE' }, select: { id: true } });
    await createNotifications(users.map((u: { id: string }) => ({ userId: u.id, type: 'ADMIN' as const, title: req.body.title, body: req.body.body })));
    await audit(req, { action: 'notifications.broadcast', resource: 'notifications', newValue: { audience: req.body.audience, count: users.length } });
    return created(res, { sent: users.length }, 'Broadcast sent');
  }));
