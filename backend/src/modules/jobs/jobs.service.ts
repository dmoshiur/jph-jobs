import { prisma } from '../../database/prisma.js';
import { ApiError, ForbiddenError } from '../../utils/errors.js';
import { slugify } from '../../utils/slug.js';
import { nanoid } from 'nanoid';

export async function listJobs(query: { q?: string; districtId?: string; categoryId?: string; type?: string; page: number; limit: number }) {
  const where = {
    status: { in: ['APPROVED', 'PUBLISHED'] as const },
    ...(query.q ? { OR: [{ title: { contains: query.q, mode: 'insensitive' as const } }, { requirements: { contains: query.q, mode: 'insensitive' as const } }] } : {}),
    ...(query.districtId ? { districtId: query.districtId } : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.type ? { type: query.type as never } : {})
  };
  const [items, total] = await Promise.all([
    prisma.job.findMany({ where, include: { company: true, category: true, district: true, upazila: true, package: true }, orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }], skip: (query.page - 1) * query.limit, take: query.limit }),
    prisma.job.count({ where })
  ]);
  return { items, total, page: query.page, limit: query.limit, pages: Math.ceil(total / query.limit) };
}

export async function getJob(id: string) {
  const job = await prisma.job.findUnique({ where: { id }, include: { company: true, category: true, district: true, upazila: true, skills: { include: { skill: true } } } });
  if (!job || job.status === 'DELETED') throw new ApiError(404, 'Job not found');
  await prisma.job.update({ where: { id }, data: { views: { increment: 1 } } });
  return job;
}

export async function createJob(userId: string, data: any) {
  const membership = await prisma.companyMember.findFirst({ where: { companyId: data.companyId, userId } });
  const company = await prisma.company.findUnique({ where: { id: data.companyId } });
  if (!company) throw new ApiError(404, 'Company not found');
  if (!membership && company.ownerId !== userId) throw new ForbiddenError('You cannot post for this company');
  const slug = `${slugify(data.title)}-${nanoid(6)}`;
  return prisma.job.create({
    data: {
      creatorId: userId,
      companyId: data.companyId,
      categoryId: data.categoryId,
      packageId: data.packageId,
      title: data.title,
      slug,
      type: data.type,
      vacancy: data.vacancy ?? 1,
      salaryMin: data.salaryMin,
      salaryMax: data.salaryMax,
      salaryText: data.salaryText,
      experience: data.experience,
      education: data.education,
      responsibilities: data.responsibilities,
      requirements: data.requirements,
      benefits: data.benefits,
      districtId: data.districtId,
      upazilaId: data.upazilaId,
      deadline: data.deadline,
      status: 'PENDING_REVIEW',
      skills: { create: (data.skillIds ?? []).map((skillId: string) => ({ skillId })) }
    }
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
      await tx.jobSkill.createMany({ data: skillIds.map((skillId: string) => ({ jobId: id, skillId })), skipDuplicates: true });
    }
    return tx.job.update({ where: { id }, data: rest });
  });
}
