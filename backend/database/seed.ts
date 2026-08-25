/**
 * Firestore seed for JPH Jobs (no SQL — runs against Cloud Firestore).
 *
 * Idempotent: safe to run multiple times. Creates:
 *  - roles + permissions (candidate, employer, shop-owner, super-admin, root-admin)
 *  - the root admin (Firebase Auth + Firestore) from ROOT_ADMIN_EMAIL / PASSWORD
 *  - locations for Bogura & Joypurhat (districts + upazilas)
 *  - job categories, skills and job packages
 *  - core site settings
 *  - a small amount of demo content (only when SEED_DEMO=1)
 *
 * Run: npm run seed
 * Requires Firebase credentials (see .env.example) or the Firestore emulator.
 */
import { prisma } from '../src/database/prisma.js';
import { slugify } from '../src/utils/slug.js';
import { isFirebaseConfigured } from '../src/config/env.js';
import { bootstrap } from '../src/config/bootstrap.js';
import { createAuthUser } from '../src/auth/user.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

const DISTRICTS = [
  { name: 'Bogura', upazilas: ['Bogura Sadar', 'Shajahanpur', 'Sherpur', 'Shibganj', 'Kahaloo', 'Nandigram', 'Dhunat', 'Dhupchanchia', 'Adamdighi', 'Sonatala', 'Sariakandi', 'Gabtali'] },
  { name: 'Joypurhat', upazilas: ['Joypurhat Sadar', 'Panchbibi', 'Akkelpur', 'Khetlal', 'Kalai'] }
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
  { name: 'Free', slug: 'free', type: 'JOB', price: 0, durationDays: 15, sortOrder: 1, features: [['tier', 'FREE'], ['active_days', '15'], ['featured', '0'], ['hot', '0'], ['applicants', 'Unlimited']] },
  { name: 'Basic', slug: 'basic', type: 'JOB', price: 49900, durationDays: 30, sortOrder: 2, features: [['tier', 'BASIC'], ['active_days', '30'], ['featured', '0'], ['hot', '0'], ['applicants', 'Unlimited']] },
  { name: 'Featured', slug: 'featured', type: 'JOB', price: 149900, durationDays: 30, sortOrder: 3, features: [['tier', 'FEATURED'], ['active_days', '30'], ['featured', '1'], ['hot', '0'], ['applicants', 'Unlimited'], ['homepage', '1']] },
  { name: 'Hot / Urgent', slug: 'hot', type: 'JOB', price: 249900, durationDays: 30, sortOrder: 4, features: [['tier', 'HOT'], ['active_days', '30'], ['featured', '1'], ['hot', '1'], ['applicants', 'Unlimited'], ['homepage', '1'], ['urgent_badge', '1']] },
  { name: 'Employer Monthly', slug: 'employer-monthly', type: 'SUBSCRIPTION', price: 99900, durationDays: 30, sortOrder: 10, features: [['job_posts', '10'], ['featured_jobs', '2'], ['company_verified', '1']] }
];

async function seed() {
  if (!isFirebaseConfigured) {
    throw new Error(
      'Cannot seed Firestore: Firebase Admin credentials are missing. Set FIREBASE_SERVICE_ACCOUNT or ' +
      'FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in backend/.env. ' +
      'FIREBASE_DATABASE_URL alone is not enough; use FIRESTORE_EMULATOR_HOST for emulator mode.'
    );
  }

  console.log('Bootstrapping roles, permissions and root admin...');
  await bootstrap();

  console.log('Seeding locations...');
  const country = await prisma.location.upsert({ where: { slug: 'bangladesh' }, update: {}, create: { name: 'Bangladesh', slug: 'bangladesh', type: 'COUNTRY' } });
  const division = await prisma.location.upsert({ where: { slug: 'rajshahi' }, update: {}, create: { name: 'Rajshahi', slug: 'rajshahi', type: 'DIVISION', parentId: country.id } });
  for (const district of DISTRICTS) {
    const d = await prisma.location.upsert({ where: { slug: slugify(district.name) }, update: { parentId: division.id }, create: { name: district.name, slug: slugify(district.name), type: 'DISTRICT', parentId: division.id } });
    for (const u of district.upazilas) {
      await prisma.location.upsert({ where: { slug: slugify(`${district.name}-${u}`) }, update: { parentId: d.id }, create: { name: u, slug: slugify(`${district.name}-${u}`), type: 'UPAZILA', parentId: d.id } });
    }
  }

  console.log('Seeding categories...');
  for (const name of CATEGORIES) {
    await prisma.jobCategory.upsert({ where: { slug: slugify(name) }, update: { name }, create: { name, slug: slugify(name) } });
  }

  console.log('Seeding skills...');
  for (const name of SKILLS) {
    await prisma.skill.upsert({ where: { slug: slugify(name) }, update: { name }, create: { name, slug: slugify(name) } });
  }

  console.log('Seeding packages...');
  for (const pkg of PACKAGES) {
    const created = await prisma.package.upsert({
      where: { slug: pkg.slug },
      update: { name: pkg.name, type: pkg.type, price: pkg.price, durationDays: pkg.durationDays, sortOrder: pkg.sortOrder, isActive: true },
      create: { name: pkg.name, slug: pkg.slug, type: pkg.type, price: pkg.price, durationDays: pkg.durationDays, sortOrder: pkg.sortOrder, isActive: true }
    });
    const existing = await prisma.packageFeature.findMany({ where: { packageId: created.id } });
    for (const [key, value] of pkg.features) {
      const found = existing.find((f: any) => f.key === key);
      if (found) {
        if (found.value !== value) await prisma.packageFeature.update({ where: { id: found.id }, data: { value } });
      } else {
        await prisma.packageFeature.create({ data: { packageId: created.id, key, value } });
      }
    }
  }

  console.log('Seeding site settings...');
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
    await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }

  if (process.env.SEED_DEMO === '1') {
    console.log('Seeding demo content (SEED_DEMO=1)...');
    await seedDemo();
  }

  console.log('Seed complete.');
}

async function seedDemo() {
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
    let user = await prisma.user.findFirst({ where: { email: e.email } });
    if (!user) {
      user = await createAuthUser({ name: e.name, email: e.email, password: 'DemoPass123', roleSlugs: ['employer'], status: 'ACTIVE', emailVerified: true }) as any;
    }
    const company = await prisma.company.upsert({
      where: { slug: slugify(e.name) },
      update: { ownerId: user!.id, verificationStatus: 'VERIFIED', category: e.category, districtId: bogura.id },
      create: { ownerId: user!.id, name: e.name, slug: slugify(e.name), verificationStatus: 'VERIFIED', category: e.category, districtId: bogura.id, about: `${e.name} is a local employer in Bogura.` }
    });
    await prisma.companyMember.upsert({
      where: { companyId_userId: { companyId: company.id, userId: user!.id } },
      update: {},
      create: { companyId: company.id, userId: user!.id, role: 'owner', title: 'Owner' }
    });

    const titles = ['Sales Executive', 'Accountant', 'Store Manager', 'Field Officer', 'Customer Support'];
    for (let i = 0; i < titles.length; i++) {
      const title = `${titles[i]} - ${e.name}`;
      const slug = slugify(title);
      if (await prisma.job.findUnique({ where: { slug } })) continue;
      await prisma.job.create({
        data: {
          creatorId: user!.id, companyId: company.id,
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

  const candEmail = 'candidate@test.test';
  let candidate = await prisma.user.findFirst({ where: { email: candEmail } });
  if (!candidate) {
    candidate = await createAuthUser({ name: 'Demo Candidate', email: candEmail, password: 'DemoPass123', roleSlugs: ['candidate'], status: 'ACTIVE', emailVerified: true, createCandidateProfile: true }) as any;
  }
  await prisma.candidateProfile.upsert({ where: { userId: candidate!.id }, update: {}, create: { userId: candidate!.id, title: 'Sales Professional', summary: 'Looking for work in Bogura.' } });
}

seed()
  .then(async () => { await prisma.$disconnect(); process.exit(0); })
  .catch(async (error) => { console.error('Seed failed:', error); await prisma.$disconnect(); process.exit(1); });
