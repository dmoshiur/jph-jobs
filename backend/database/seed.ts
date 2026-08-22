import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { env } from '../src/config/env.js';
import { slugify } from '../src/utils/slug.js';

const prisma = new PrismaClient();

const permissions = [
  'users.view','users.create','users.edit','users.delete',
  'candidates.view','candidates.edit','employers.view','employers.edit',
  'companies.view','companies.create','companies.verify','companies.edit','companies.delete',
  'businesses.view','businesses.create','businesses.edit','businesses.delete',
  'jobs.view','jobs.create','jobs.edit','jobs.approve','jobs.reject','jobs.delete',
  'applications.view','applications.create','applications.own','applications.edit',
  'payments.view','payments.refund','packages.view','packages.edit','subscriptions.view','subscriptions.edit',
  'advertisements.view','advertisements.edit','reports.view','reports.edit',
  'categories.view','categories.edit','skills.view','skills.edit','locations.view','locations.edit',
  'notifications.view','notifications.send','cms.view','cms.edit','settings.view','settings.edit',
  'admins.view','admins.create','admins.edit','admins.delete','audit_logs.view','analytics.view'
];

const rolePermissions: Record<string, string[]> = {
  'candidate': ['applications.create','applications.own'],
  'employer': ['companies.create','jobs.create','applications.view','payments.view'],
  'company-owner': ['companies.create','companies.edit','jobs.create','jobs.edit','applications.view','payments.view'],
  'recruiter': ['jobs.create','jobs.edit','applications.view','applications.edit'],
  'moderator': ['jobs.view','jobs.approve','jobs.reject','companies.view','companies.verify','reports.view','reports.edit'],
  'admin': permissions.filter((p) => !p.startsWith('admins.') && p !== 'settings.edit'),
  'super-admin': permissions.filter((p) => p !== 'admins.delete'),
  'root-admin': permissions
};

const roles = [
  ['Candidate', 'candidate'], ['Employer', 'employer'], ['Company Owner', 'company-owner'], ['Recruiter', 'recruiter'],
  ['Moderator', 'moderator'], ['Admin', 'admin'], ['Super Admin', 'super-admin'], ['Root Admin', 'root-admin']
] as const;

const boguraUpazilas = ['Bogura Sadar','Sherpur','Shajahanpur','Gabtali','Sariakandi','Sonatala','Dhunat','Nandigram','Kahaloo','Dupchanchia','Adamdighi','Shibganj'];
const joypurhatUpazilas = ['Joypurhat Sadar','Akkelpur','Kalai','Khetlal','Panchbibi'];

async function upsertLocation(name: string, type: 'DISTRICT' | 'UPAZILA', parentId?: string) {
  return prisma.location.upsert({ where: { slug: slugify(name) }, update: { name, type, parentId, isActive: true }, create: { name, slug: slugify(name), type, parentId } });
}

async function main() {
  for (const key of permissions) {
    await prisma.permission.upsert({ where: { key }, update: {}, create: { key, description: key.replace('.', ' ') } });
  }

  for (const [name, slug] of roles) {
    const role = await prisma.role.upsert({ where: { slug }, update: { name, system: true }, create: { name, slug, system: true } });
    const keys = rolePermissions[slug] ?? [];
    for (const key of keys) {
      const permission = await prisma.permission.findUniqueOrThrow({ where: { key } });
      await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } }, update: {}, create: { roleId: role.id, permissionId: permission.id } });
    }
  }

  const bogura = await upsertLocation('Bogura', 'DISTRICT');
  const joypurhat = await upsertLocation('Joypurhat', 'DISTRICT');
  for (const name of boguraUpazilas) await upsertLocation(name, 'UPAZILA', bogura.id);
  for (const name of joypurhatUpazilas) await upsertLocation(name, 'UPAZILA', joypurhat.id);

  const categories = ['Accounting','Administration','Education','Engineering','Healthcare','IT & Software','Marketing','Sales','Customer Service','Manufacturing','NGO','Retail'];
  for (const name of categories) await prisma.jobCategory.upsert({ where: { slug: slugify(name) }, update: { name, isActive: true }, create: { name, slug: slugify(name) } });

  const skillNames = ['Communication','MS Office','Sales','Customer Support','JavaScript','React','Node.js','Accounting','Teaching','Digital Marketing','Graphic Design'];
  for (const name of skillNames) await prisma.skill.upsert({ where: { slug: slugify(name) }, update: { name }, create: { name, slug: slugify(name) } });

  const packages = [
    { name: 'FREE', slug: 'free', type: 'JOB' as const, price: 0, durationDays: 7, sortOrder: 0, features: ['1 active job','Basic listing'] },
    { name: 'BASIC', slug: 'basic', type: 'JOB' as const, price: 19900, durationDays: 15, sortOrder: 1, features: ['15 days active','Employer dashboard'] },
    { name: 'FEATURED', slug: 'featured', type: 'JOB' as const, price: 39900, durationDays: 30, sortOrder: 2, features: ['Featured placement','30 days active','Higher visibility'] },
    { name: 'HOT', slug: 'hot', type: 'JOB' as const, price: 69900, durationDays: 30, sortOrder: 3, features: ['Hot badge','Top placement','Job alert boost'] },
    { name: 'Starter', slug: 'starter', type: 'SUBSCRIPTION' as const, price: 99900, durationDays: 30, sortOrder: 10, features: ['5 jobs/month','Candidate shortlist'] },
    { name: 'Business', slug: 'business', type: 'SUBSCRIPTION' as const, price: 249900, durationDays: 30, sortOrder: 11, features: ['20 jobs/month','Team recruiters','Analytics'] },
    { name: 'Enterprise', slug: 'enterprise', type: 'SUBSCRIPTION' as const, price: 499900, durationDays: 30, sortOrder: 12, features: ['Unlimited jobs','Priority support','Advanced analytics'] }
  ];

  for (const pkg of packages) {
    const saved = await prisma.package.upsert({ where: { slug: pkg.slug }, update: { name: pkg.name, type: pkg.type, price: pkg.price, durationDays: pkg.durationDays, sortOrder: pkg.sortOrder, isActive: true }, create: { name: pkg.name, slug: pkg.slug, type: pkg.type, price: pkg.price, durationDays: pkg.durationDays, sortOrder: pkg.sortOrder } });
    await prisma.packageFeature.deleteMany({ where: { packageId: saved.id } });
    await prisma.packageFeature.createMany({ data: pkg.features.map((feature, index) => ({ packageId: saved.id, key: `feature_${index + 1}`, value: feature })) });
  }

  const rootRole = await prisma.role.findUniqueOrThrow({ where: { slug: 'root-admin' } });
  const passwordHash = await bcrypt.hash(env.ROOT_ADMIN_PASSWORD, 12);
  const root = await prisma.user.upsert({
    where: { email: env.ROOT_ADMIN_EMAIL },
    update: { name: 'Root Admin', passwordHash, status: 'ACTIVE' },
    create: { name: 'Root Admin', email: env.ROOT_ADMIN_EMAIL, passwordHash, status: 'ACTIVE', emailVerifiedAt: new Date() }
  });
  await prisma.userRole.upsert({ where: { userId_roleId: { userId: root.id, roleId: rootRole.id } }, update: {}, create: { userId: root.id, roleId: rootRole.id } });

  await prisma.setting.upsert({ where: { key: 'platform.locations.initial' }, update: { value: ['Bogura', 'Joypurhat'] }, create: { key: 'platform.locations.initial', value: ['Bogura', 'Joypurhat'] } });
  console.log('Seed completed');
}

main().finally(async () => prisma.$disconnect());
