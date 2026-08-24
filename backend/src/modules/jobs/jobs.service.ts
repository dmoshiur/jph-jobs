import { nanoid } from 'nanoid';
import { prisma } from '../../database/prisma.js';
import { ApiError, ForbiddenError } from '../../utils/errors.js';
import { slugify } from '../../utils/slug.js';
import { resolveTier } from './job-tier.js';
import { canPostJobs, canViewApplications } from '../companies/ranks.js';

/* eslint-disable @typescript-eslint/no-explicit-any */
const JOB_INCLUDE = {
  company: { include: { district: true, upazila: true } },
  category: true,
  district: true,
  upazila: true,
  package: { include: { features: true } },
  skills: { include: { skill: true } }
} as const;

const PUBLIC_STATUSES = ['APPROVED', 'PUBLISHED'] as const;

export interface JobListQuery {
  q?: string;
  districtId?: string;
  upazilaId?: string;
  location?: string;
  categoryId?: string;
  category?: string;
  type?: string;
  salaryMin?: number;
  experience?: string;
  education?: string;
  companyId?: string;
  verified?: 'true' | 'false';
  featured?: 'true' | 'false';
  hot?: 'true' | 'false';
  postedWithin?: '24h' | '7d' | '30d';
  sort?: 'newest' | 'deadline' | 'salary' | 'relevance';
  page: number;
  limit: number;
}

function serializeJob(job: any) {
  return { ...job, tier: resolveTier(job.package ?? null) };
}

function buildWhere(query: JobListQuery): Record<string, unknown> {
  const where: Record<string, unknown> = {
    status: { in: [...PUBLIC_STATUSES] },
    deadline: { gt: new Date() }
  };
  if (query.companyId) where.companyId = query.companyId;
  if (query.type) where.type = query.type;
  if (query.experience) where.experience = { contains: query.experience, mode: 'insensitive' };
  if (query.education) where.education = { contains: query.education, mode: 'insensitive' };
  if (query.salaryMin) where.salaryMax = { gte: query.salaryMin };

  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: 'insensitive' } },
      { requirements: { contains: query.q, mode: 'insensitive' } },
      { responsibilities: { contains: query.q, mode: 'insensitive' } },
      { company: { is: { name: { contains: query.q, mode: 'insensitive' } } } },
      { skills: { some: { skill: { name: { contains: query.q, mode: 'insensitive' } } } } }
    ];
  }

  if (query.districtId) where.districtId = query.districtId;
  if (query.upazilaId) where.upazilaId = query.upazilaId;
  if (query.location) {
    const or = (where.OR as any[] | undefined) ?? [];
    or.push(
      { district: { is: { slug: query.location } } },
      { upazila: { is: { slug: query.location } } },
      { district: { is: { name: { contains: query.location, mode: 'insensitive' } } } }
    );
    where.OR = or;
  }
  if (query.categoryId) where.categoryId = query.categoryId;
  if (query.category) where.category = { is: { slug: query.category } };
  if (query.verified === 'true') where.company = { is: { ...((where.company as any) ?? {}), verificationStatus: 'VERIFIED' } };

  if (query.featured === 'true') {
    where.package = { is: { ...((where.package as any) ?? {}), OR: [{ slug: { contains: 'featured' } }, { slug: { contains: 'hot' } }, { features: { some: { key: 'featured', value: '1' } } }] } };
  }
  if (query.hot === 'true') {
    where.package = { is: { ...((where.package as any) ?? {}), slug: { contains: 'hot' } } };
  }

  if (query.postedWithin) {
    const days = query.postedWithin === '24h' ? 1 : query.postedWithin === '7d' ? 7 : 30;
    where.createdAt = { gte: new Date(Date.now() - days * 86400_000) };
  }
  return where;
}

export async function listJobs(query: JobListQuery) {
  const where = buildWhere(query);
  let orderBy: any = [{ publishedAt: 'desc' }, { createdAt: 'desc' }];
  if (query.sort === 'deadline') orderBy = [{ deadline: 'asc' }];
  else if (query.sort === 'salary') orderBy = [{ salaryMax: 'desc' }, { publishedAt: 'desc' }];

  const [items, total] = await Promise.all([
    prisma.job.findMany({ where, include: JOB_INCLUDE, orderBy, skip: (query.page - 1) * query.limit, take: query.limit }),
    prisma.job.count({ where })
  ]);
  return { items: items.map(serializeJob), total, page: query.page, limit: query.limit, pages: Math.ceil(total / query.limit) };
}

export async function getJob(identifier: string) {
  const job = await prisma.job.findFirst({
    where: { OR: [{ id: identifier }, { slug: identifier }] },
    include: JOB_INCLUDE
  });
  if (!job || job.status === 'DELETED') throw new ApiError(404, 'Job not found');
  if (!PUBLIC_STATUSES.includes(job.status)) throw new ApiError(404, 'Job not found');
  await prisma.job.update({ where: { id: job.id }, data: { views: { increment: 1 } } }).catch(() => undefined);
  return serializeJob(job);
}

export async function getFeatured(limit = 8) {
  const items = await prisma.job.findMany({
    where: { status: { in: [...PUBLIC_STATUSES] }, deadline: { gt: new Date() }, package: { slug: { contains: 'featured' } } },
    include: JOB_INCLUDE, orderBy: { publishedAt: 'desc' }, take: limit
  });
  const hot = items.filter((j: any) => j.package?.slug.includes('hot'));
  return { items: [...hot, ...items.filter((j: any) => !j.package?.slug.includes('hot'))].slice(0, limit).map(serializeJob) };
}

export async function getHot(limit = 6) {
  const items = await prisma.job.findMany({
    where: { status: { in: [...PUBLIC_STATUSES] }, deadline: { gt: new Date() }, package: { slug: { contains: 'hot' } } },
    include: JOB_INCLUDE, orderBy: { publishedAt: 'desc' }, take: limit
  });
  return { items: items.map(serializeJob) };
}

export async function getLatest(limit = 10) {
  const items = await prisma.job.findMany({
    where: { status: { in: [...PUBLIC_STATUSES] }, deadline: { gt: new Date() } },
    include: JOB_INCLUDE, orderBy: { publishedAt: 'desc' }, take: limit
  });
  return { items: items.map(serializeJob) };
}

export async function getDeadlineTomorrow(limit = 6) {
  const start = new Date();
  const end = new Date(Date.now() + 36 * 3600_000);
  const items = await prisma.job.findMany({
    where: { status: { in: [...PUBLIC_STATUSES] }, deadline: { gt: start, lt: end } },
    include: JOB_INCLUDE, orderBy: { deadline: 'asc' }, take: limit
  });
  return { items: items.map(serializeJob) };
}

export async function getPublicStats() {
  const now = new Date();
  const dayAgo = new Date(Date.now() - 86400_000);
  const [liveJobs, vacancies, companies, newJobs] = await Promise.all([
    prisma.job.count({ where: { status: { in: ['APPROVED', 'PUBLISHED'] }, deadline: { gt: now } } }),
    prisma.job.aggregate({ where: { status: { in: ['APPROVED', 'PUBLISHED'] }, deadline: { gt: now } }, _sum: { vacancy: true } }),
    prisma.company.count({ where: { verificationStatus: 'VERIFIED' } }),
    prisma.job.count({ where: { publishedAt: { gte: dayAgo } } })
  ]);
  return { liveJobs, vacancies: vacancies._sum.vacancy ?? liveJobs, companies, newJobs };
}

export async function getQuickLinkCounts() {
  const now = new Date();
  const base = { status: { in: ['APPROVED', 'PUBLISHED'] }, deadline: { gt: now } };
  const [latest, deadlineTomorrow, internship, partTime, remote, fresher, urgent, verifiedCompanies] = await Promise.all([
    prisma.job.count({ where: { ...base } }),
    prisma.job.count({ where: { ...base, deadline: { lt: new Date(Date.now() + 36 * 3600_000) } } }),
    prisma.job.count({ where: { ...base, type: 'INTERNSHIP' } }),
    prisma.job.count({ where: { ...base, type: 'PART_TIME' } }),
    prisma.job.count({ where: { ...base, OR: [{ type: 'REMOTE' }, { title: { contains: 'remote', mode: 'insensitive' } }] } }),
    prisma.job.count({ where: { ...base, OR: [{ experience: { contains: 'fresher', mode: 'insensitive' } }, { experience: { contains: '0-1', mode: 'insensitive' } }] } }),
    prisma.job.count({ where: { ...base, package: { slug: { contains: 'hot' } } } }),
    prisma.company.count({ where: { verificationStatus: 'VERIFIED' } })
  ]);
  return { latest, deadlineTomorrow, internship, partTime, remote, fresher, urgent, verifiedCompanies };
}

export async function createJob(userId: string, data: any) {
  const membership = await prisma.companyMember.findFirst({ where: { companyId: data.companyId, userId } });
  const company = await prisma.company.findUnique({ where: { id: data.companyId } });
  if (!company) throw new ApiError(404, 'Company not found');
  if (!membership && company.ownerId !== userId) throw new ForbiddenError('You cannot post for this company');

  if (data.packageId) {
    const pkg = await prisma.package.findUnique({ where: { id: data.packageId } });
    if (!pkg) throw new ApiError(400, 'Invalid package');
    if (pkg.price > 0) {
      const paid = await prisma.order.findFirst({
        where: { userId, packageId: pkg.id, status: 'COMPLETED', payments: { some: { status: 'SUCCESS' } } }
      });
      if (!paid) throw new ApiError(402, 'Payment required before posting with this package');
    }
  }

  const slug = `${slugify(data.title)}-${nanoid(6)}`;
  const durationDays = (data.packageId ? (await prisma.package.findUnique({ where: { id: data.packageId } }))?.durationDays : 30) ?? 30;
  const deadline = new Date(data.deadline);
  const expiresAt = new Date(Math.min(deadline.getTime(), Date.now() + durationDays * 86400_000));

  return prisma.job.create({
    data: {
      creatorId: userId, companyId: data.companyId, categoryId: data.categoryId, packageId: data.packageId,
      title: data.title, slug, type: data.type, vacancy: data.vacancy ?? 1,
      salaryMin: data.salaryMin, salaryMax: data.salaryMax, salaryText: data.salaryText,
      experience: data.experience, education: data.education,
      responsibilities: data.responsibilities, requirements: data.requirements, benefits: data.benefits,
      districtId: data.districtId, upazilaId: data.upazilaId, deadline, expiresAt,
      status: data.publishNow ? 'PUBLISHED' : 'PENDING_REVIEW',
      publishedAt: data.publishNow ? new Date() : null,
      skills: { create: (data.skillIds ?? []).map((skillId: string) => ({ skillId })) }
    },
    include: JOB_INCLUDE
  });
}

export async function updateJob(userId: string, isPrivileged: boolean, id: string, data: any) {
  const existing = await prisma.job.findUnique({ where: { id }, include: { company: true } });
  if (!existing) throw new ApiError(404, 'Job not found');
  if (!isPrivileged && existing.creatorId !== userId && existing.company.ownerId !== userId) throw new ForbiddenError('Cannot edit this job');
  const { skillIds, ...rest } = data;
  return prisma.$transaction(async (tx: any) => {
    if (skillIds) {
      await tx.jobSkill.deleteMany({ where: { jobId: id } });
      if (skillIds.length) await tx.jobSkill.createMany({ data: skillIds.map((skillId: string) => ({ jobId: id, skillId })), skipDuplicates: true });
    }
    return tx.job.update({ where: { id }, data: rest, include: JOB_INCLUDE });
  });
}

export async function listMyJobs(userId: string) {
  return prisma.job.findMany({
    where: { OR: [{ creatorId: userId }, { company: { ownerId: userId } }, { company: { members: { some: { userId } } } }] },
    include: { ...JOB_INCLUDE, _count: { select: { applications: true } } },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getApplicants(userId: string, jobId: string) {
  const job = await prisma.job.findUnique({ where: { id: jobId }, include: { company: true } });
  if (!job) throw new ApiError(404, 'Job not found');
  const isMember = await prisma.companyMember.findFirst({ where: { companyId: job.companyId, userId } });
  const rank = isMember?.role ?? (job.company.ownerId === userId ? 'owner' : job.creatorId === userId ? 'owner' : null);
  if (!rank) throw new ForbiddenError('Not allowed');
  if (!canViewApplications(rank) && job.creatorId !== userId) throw new ForbiddenError('Your rank cannot view applicants');
  return prisma.application.findMany({
    where: { jobId },
    include: { candidate: { select: { id: true, name: true, email: true, phone: true, candidateProfile: true } } },
    orderBy: { createdAt: 'desc' }
  });
}
