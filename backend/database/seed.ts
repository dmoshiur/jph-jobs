/**
 * Database seed for JPH Jobs.
 *
 * Idempotent: safe to run multiple times. Creates:
 *  - roles + permissions (candidate, employer, super-admin, root-admin)
 *  - the root admin account from ROOT_ADMIN_EMAIL / ROOT_ADMIN_PASSWORD
 *  - locations for Bogura & Joypurhat (districts + upazilas)
 *  - job categories, skills and job packages
 *  - a small amount of demo content (only when SEED_DEMO=1)
 *
 * Run: npm run seed
 */
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { slugify } from '../src/utils/slug.js';
import { env } from '../src/config/env.js';

const prisma = new PrismaClient();

const PERMISSIONS = [
  'analytics.view',
  'users.view', 'users.edit',
  'jobs.view', 'jobs.create', 'jobs.edit', 'jobs.approve', 'jobs.delete',
  'companies.view', 'companies.create', 'companies.edit', 'companies.verify',
  'businesses.view', 'businesses.create', 'businesses.edit', 'businesses.verify',
  'applications.view', 'applications.create', 'applications.edit', 'applications.own',
  'candidates.view', 'candidates.edit',
  'packages.view', 'packages.edit',
  'payments.view', 'payments.refund',
  'advertisements.view', 'advertisements.edit',
  'categories.view', 'categories.edit',
  'locations.view', 'locations.edit',
  'skills.view', 'skills.edit',
  'reports.view', 'reports.edit',
  'reviews.view', 'reviews.edit',
  'notifications.view', 'notifications.edit',
  'cms.view', 'cms.edit',
  'settings.view', 'settings.edit',
  'admins.view', 'admins.create', 'admins.edit', 'admins.delete',
  'audit_logs.view'
] as const;

const ROLES: Record<string, string[]> = {
  candidate: ['applications.create', 'applications.own', 'jobs.view', 'companies.view', 'businesses.view'],
  employer: [
    'jobs.create', 'jobs.edit', 'companies.create', 'companies.edit',
    'applications.view', 'applications.edit',
    'businesses.create', 'businesses.edit',
    'packages.view', 'payments.view'
  ],
  // super-admin gets everything except root-only actions; root-admin bypasses checks in middleware.
  'super-admin': PERMISSIONS.filter((p) => p !== 'admins.delete').map((p) => p)
};

const DISTRICTS = [
  {
    name: 'Bogura', bnName: 'বগুড়া',
    upazilas: ['Bogura Sadar', 'Shajahanpur', 'Sherpur', 'Shibganj', 'Kahaloo', 'Nandigram', 'Dhunat', 'Dhupchanchia', 'Adamdighi', 'Sonatala', 'Sariakandi', 'Gabtali']
  },
  {
    name: 'Joypurhat', bnName: 'জয়পুরহাট',
    upazilas: ['Joypurhat Sadar', 'Panchbibi', 'Akkelpur', 'Khetlal', 'Kalai']
  }
];

const CATEGORIES = [
  'Accounting/Finance', 'Marketing/Sales', 'IT/Telecommunication', 'Education/Training',
  'Engineering', 'Healthcare', 'Production/Operation', 'Hospitality', 'Agro',
  'NGO/Development', 'Supply Chain', 'Commercial', 'Data Entry', 'Customer Service',
  'HR/Admin', 'Driving', 'Security', 'Retail', 'Restaurant'
];

const SKILLS = [
  'Microsoft Office', 'Excel', 'Communication', 'Sales', 'Marketing', 'Accounting',
  'HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'PHP', 'Python', 'Graphic Design',
  'Video Editing', 'English', 'Bangla', 'Driving', 'Cooking', 'Teaching', 'Nursing',
  'Electrical', 'Mechanical', 'Warehouse', 'Customer Support', 'Social Media'
];

const PACKAGES = [
  {
    name: 'Free', slug: 'free', type: 'JOB' as const, price: 0, durationDays: 15, sortOrder: 1,
    features: [['tier', 'FREE'], ['active_days', '15'], ['featured', '0'], ['hot', '0'], ['applicants', 'Unlimited']]
  },
  {
    name: 'Basic', slug: 'basic', type: 'JOB' as const, price: 49900, durationDays: 30, sortOrder: 2,
    features: [['tier', 'BASIC'], ['active_days', '30'], ['featured', '0'], ['hot', '0'], ['applicants', 'Unlimited']]
  },
  {
    name: 'Featured', slug: 'featured', type: 'JOB' as const, price: 149900, durationDays: 30, sortOrder: 3,
    features: [['tier', 'FEATURED'], ['active_days', '30'], ['featured', '1'], ['hot', '0'], ['applicants', 'Unlimited'], ['homepage', '1']]
  },
  {
    name: 'Hot / Urgent', slug: 'hot', type: 'JOB' as const, price: 249900, durationDays: 30, sortOrder: 4,
    features: [['tier', 'HOT'], ['active_days', '30'], ['featured', '1'], ['hot', '1'], ['applicants', 'Unlimited'], ['homepage', '1'], ['urgent_badge', '1']]
  },
  {
    name: 'Employer Monthly', slug: 'employer-monthly', type: 'SUBSCRIPTION' as const, price: 99900, durationDays: 30, sortOrder: 10,
    features: [['job_posts', '10'], ['featured_jobs', '2'], ['company_verified', '1']]
  }
];

async function upsertRole(slug: string, permissionKeys: string[]) {
  const role = await prisma.role.upsert({
    where: { slug },
    update: { description: `${slug} role` },
    create: { name: slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' '), slug, system: true, description: `${slug} role` }
  });
  if (permissionKeys.length) {
    const perms = await prisma.permission.findMany({ where: { key: { in: permissionKeys } } });
    await Promise.all(perms.map((p: { id: string }) => prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: p.id } },
      update: {},
      create: { roleId: role.id, permissionId: p.id }
    })));
  }
  return role;
}

async function seed() {
  console.log('Seeding roles & permissions...');
  await Promise.all(PERMISSIONS.map((key) => prisma.permission.upsert({
    where: { key }, update: { description: key }, create: { key, description: key }
  })));

  for (const [slug, perms] of Object.entries(ROLES)) {
    await upsertRole(slug, perms);
  }
  // root-admin role exists for completeness; middleware short-circuits for it.
  await upsertRole('root-admin', PERMISSIONS as unknown as string[]);

  console.log('Seeding root admin...');
  const rootRole = await prisma.role.findUniqueOrThrow({ where: { slug: 'root-admin' } });
  const rootPasswordHash = await bcrypt.hash(env.ROOT_ADMIN_PASSWORD, 12);
  const root = await prisma.user.upsert({
    where: { email: env.ROOT_ADMIN_EMAIL },
    update: { passwordHash: rootPasswordHash, status: 'ACTIVE', emailVerifiedAt: new Date() },
    create: { name: 'Root Admin', email: env.ROOT_ADMIN_EMAIL, passwordHash: rootPasswordHash, status: 'ACTIVE', emailVerifiedAt: new Date() }
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: root.id, roleId: rootRole.id } },
    update: {},
    create: { userId: root.id, roleId: rootRole.id }
  });

  console.log('Seeding locations...');
  const country = await prisma.location.upsert({
    where: { slug: 'bangladesh' },
    update: {},
    create: { name: 'Bangladesh', slug: 'bangladesh', type: 'COUNTRY' }
  });
  const division = await prisma.location.upsert({
    where: { slug: 'rajshahi' },
    update: {},
    create: { name: 'Rajshahi', slug: 'rajshahi', type: 'DIVISION', parentId: country.id }
  });
  for (const district of DISTRICTS) {
    const d = await prisma.location.upsert({
      where: { slug: slugify(district.name) },
      update: { parentId: division.id },
      create: { name: district.name, slug: slugify(district.name), type: 'DISTRICT', parentId: division.id }
    });
    for (const u of district.upazilas) {
      await prisma.location.upsert({
        where: { slug: slugify(`${district.name}-${u}`) },
        update: { parentId: d.id },
        create: { name: u, slug: slugify(`${district.name}-${u}`), type: 'UPAZILA', parentId: d.id }
      });
    }
  }

  console.log('Seeding categories...');
  for (const name of CATEGORIES) {
    await prisma.jobCategory.upsert({
      where: { slug: slugify(name) },
      update: { name },
      create: { name, slug: slugify(name) }
    });
  }

  console.log('Seeding skills...');
  for (const name of SKILLS) {
    await prisma.skill.upsert({
      where: { slug: slugify(name) },
      update: { name },
      create: { name, slug: slugify(name) }
    });
  }

  console.log('Seeding packages...');
  for (const pkg of PACKAGES) {
    const created = await prisma.package.upsert({
      where: { slug: pkg.slug },
      update: { name: pkg.name, type: pkg.type, price: pkg.price, durationDays: pkg.durationDays, sortOrder: pkg.sortOrder, isActive: true },
      create: { name: pkg.name, slug: pkg.slug, type: pkg.type, price: pkg.price, durationDays: pkg.durationDays, sortOrder: pkg.sortOrder, isActive: true }
    });
    const existing = await prisma.packageFeature.findMany({ where: { packageId: created.id } });
    await Promise.all(pkg.features.map(async ([key, value]) => {
      const found = existing.find((f: { key: string; value: string; id: string }) => f.key === key);
      if (found) {
        if (found.value !== value) await prisma.packageFeature.update({ where: { id: found.id }, data: { value } });
      } else {
        await prisma.packageFeature.create({ data: { packageId: created.id, key, value } });
      }
    }));
  }

  // Core site settings
  const defaults: Record<string, unknown> = {
    site_name: 'JOBHUB',
    site_tagline: "Bogura & Joypurhat's Local Jobs & Business Platform",
    hero_heading_bn: 'বগুড়া ও জয়পুরহাট-এর আপনার পছন্দের চাকরি খুঁজুন',
    hero_subheading_bn: 'হাজারো স্থানীয় চাকরির সুযোগ এক জায়গায়',
    primary_color: '#1d4ed8',
    jobs_default_duration_days: 30,
    employer_requires_approval: true
  };
  for (const [key, value] of Object.entries(defaults)) {
    await prisma.setting.upsert({ where: { key }, update: { value: value as object }, create: { key, value: value as object } });
  }

  if (process.env.SEED_DEMO === '1') {
    console.log('Seeding demo content (set SEED_DEMO=1)...');
    await seedDemo();
  }

  console.log('Seed complete.');
}

async function seedDemo() {
  const employerRole = await prisma.role.findUniqueOrThrow({ where: { slug: 'employer' } });
  const candidateRole = await prisma.role.findUniqueOrThrow({ where: { slug: 'candidate' } });
  const bogura = await prisma.location.findFirstOrThrow({ where: { slug: 'bogura', type: 'DISTRICT' } });
  const joypurhat = await prisma.location.findFirstOrThrow({ where: { slug: 'joypurhat', type: 'DISTRICT' } });
  const categories = await prisma.jobCategory.findMany();

  const employers = [
    { name: 'ABC Electronics', email: 'hr@abcelectronics.test', category: 'Retail' },
    { name: 'Shapla Healthcare', email: 'careers@shaplahealth.test', category: 'Healthcare' },
    { name: 'North Bengal Agro', email: 'jobs@nbagro.test', category: 'Agro' },
    { name: 'Rajshahi IT Solutions', email: 'hr@rajshahiit.test', category: 'IT' },
    { name: 'Bogura Royal Restaurant', email: 'manager@royalrest.test', category: 'Restaurant' }
  ];

  for (const e of employers) {
    const passwordHash = await bcrypt.hash('DemoPass123', 12);
    const user = await prisma.user.upsert({
      where: { email: e.email },
      update: {},
      create: { name: e.name, email: e.email, passwordHash, status: 'ACTIVE', emailVerifiedAt: new Date() }
    });
    await prisma.userRole.upsert({ where: { userId_roleId: { userId: user.id, roleId: employerRole.id } }, update: {}, create: { userId: user.id, roleId: employerRole.id } });
    const company = await prisma.company.upsert({
      where: { slug: slugify(e.name) },
      update: { ownerId: user.id, verificationStatus: 'VERIFIED', category: e.category, districtId: bogura.id },
      create: { ownerId: user.id, name: e.name, slug: slugify(e.name), verificationStatus: 'VERIFIED', category: e.category, districtId: bogura.id, about: `${e.name} is a local employer in Bogura.`, members: { create: { userId: user.id, role: 'owner' } } }
    });

    const titles = ['Sales Executive', 'Accountant', 'Store Manager', 'Field Officer', 'Customer Support'];
    for (let i = 0; i < titles.length; i++) {
      const title = `${titles[i]} - ${e.name}`;
      const slug = slugify(title);
      if (await prisma.job.findUnique({ where: { slug } })) continue;
      await prisma.job.create({
        data: {
          creatorId: user.id, companyId: company.id,
          categoryId: categories[i % categories.length].id,
          title, slug, type: i % 3 === 0 ? 'PART_TIME' : 'FULL_TIME',
          vacancy: 1 + (i % 3),
          salaryMin: 12000 + i * 2000, salaryMax: 20000 + i * 3000, salaryText: '৳15,000–৳25,000',
          experience: '1–2 Years', education: 'HSC / Bachelor',
          responsibilities: 'Greet customers, manage sales, maintain store records and report to the manager daily.',
          requirements: 'Good communication in Bangla, basic computer literacy and willingness to work on-site.',
          benefits: 'Weekly festival bonus, lunch allowance and supportive team environment.',
          districtId: i % 2 ? joypurhat.id : bogura.id,
          deadline: new Date(Date.now() + (10 + i * 3) * 86400000),
          status: 'PUBLISHED', publishedAt: new Date(Date.now() - i * 3600_000),
          expiresAt: new Date(Date.now() + (10 + i * 3) * 86400000)
        }
      });
    }
  }

  // One candidate
  const candPasswordHash = await bcrypt.hash('DemoPass123', 12);
  const candidate = await prisma.user.upsert({
    where: { email: 'candidate@test.test' },
    update: {},
    create: { name: 'Demo Candidate', email: 'candidate@test.test', passwordHash: candPasswordHash, status: 'ACTIVE', emailVerifiedAt: new Date() }
  });
  await prisma.userRole.upsert({ where: { userId_roleId: { userId: candidate.id, roleId: candidateRole.id } }, update: {}, create: { userId: candidate.id, roleId: candidateRole.id } });
  await prisma.candidateProfile.upsert({ where: { userId: candidate.id }, update: {}, create: { userId: candidate.id, title: 'Sales Professional', summary: 'Looking for work in Bogura.' } });
}

seed()
  .catch((error) => { console.error('Seed failed:', error); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
