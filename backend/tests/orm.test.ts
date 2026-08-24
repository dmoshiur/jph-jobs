import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * In-memory Firestore double so the Prisma-compatible engine (src/database/orm.ts)
 * can be exercised without a live Firebase project. Validates the query surface
 * the application depends on: where operators, include/relations, _count,
 * aggregate, ordering, pagination, upsert and nested writes.
 */
const store = new Map<string, Map<string, any>>();

function collection(name: string) {
  if (!store.has(name)) store.set(name, new Map());
  const col = store.get(name)!;
  return {
    doc(id: string) {
      return {
        async set(data: any, options?: { merge?: boolean }) {
          const existing = options?.merge ? col.get(id) ?? {} : {};
          col.set(id, { ...existing, ...data });
        },
        async get() {
          const data = col.get(id);
          return { exists: !!data, id, data: () => data };
        },
        async delete() { col.delete(id); }
      };
    },
    async get() {
      return { docs: [...col.entries()].map(([id, data]) => ({ id, data: () => data })) };
    }
  };
}

const fakeFirestore = {
  collection,
  batch() {
    const ops: Array<() => void> = [];
    return {
      set(ref: any, data: any) { ops.push(() => ref.set(data)); },
      async commit() { for (const op of ops) await op(); }
    };
  }
};

vi.mock('../src/firebase/admin.js', () => ({
  firestore: () => fakeFirestore,
  firebaseAuth: () => ({}),
  realtimeDb: () => null,
  getFirebaseApp: () => ({})
}));

let prisma: any;

beforeEach(async () => {
  store.clear();
  const mod = await import('../src/database/orm.js');
  prisma = mod.orm;
});

describe('Firestore ORM engine', () => {
  it('creates and finds documents with defaults + timestamps', async () => {
    const role = await prisma.role.create({ data: { name: 'Candidate', slug: 'candidate', system: true } });
    expect(role.id).toBeTruthy();
    expect(role.createdAt).toBeInstanceOf(Date);

    const found = await prisma.role.findUnique({ where: { slug: 'candidate' } });
    expect(found?.name).toBe('Candidate');
  });

  it('supports where operators (in, contains/insensitive, gt) and OR', async () => {
    await prisma.job.create({ data: { title: 'Sales Executive', slug: 'a', status: 'PUBLISHED', deadline: new Date(Date.now() + 86400000), companyId: 'c1', creatorId: 'u1', type: 'FULL_TIME', responsibilities: 'x', requirements: 'y' } });
    await prisma.job.create({ data: { title: 'Draft Job', slug: 'b', status: 'DRAFT', deadline: new Date(Date.now() + 86400000), companyId: 'c1', creatorId: 'u1', type: 'FULL_TIME', responsibilities: 'x', requirements: 'y' } });

    const live = await prisma.job.findMany({ where: { status: { in: ['APPROVED', 'PUBLISHED'] }, deadline: { gt: new Date() } } });
    expect(live).toHaveLength(1);
    expect(live[0].title).toBe('Sales Executive');

    const search = await prisma.job.findMany({ where: { title: { contains: 'sales', mode: 'insensitive' } } });
    expect(search).toHaveLength(1);

    const or = await prisma.job.findMany({ where: { OR: [{ status: 'DRAFT' }, { status: 'PUBLISHED' }] } });
    expect(or).toHaveLength(2);
  });

  it('resolves belongsTo/hasMany includes and relation filters', async () => {
    const company = await prisma.company.create({ data: { name: 'ABC', slug: 'abc', ownerId: 'owner1', verificationStatus: 'VERIFIED' } });
    await prisma.job.create({ data: { title: 'Job A', slug: 'ja', status: 'PUBLISHED', deadline: new Date(Date.now() + 86400000), companyId: company.id, creatorId: 'owner1', type: 'FULL_TIME', responsibilities: 'x', requirements: 'y' } });

    const withCompany = await prisma.job.findFirst({ where: { slug: 'ja' }, include: { company: true } });
    expect(withCompany.company.name).toBe('ABC');

    const withJobs = await prisma.company.findFirst({ where: { slug: 'abc' }, include: { jobs: true, _count: { select: { jobs: true } } } });
    expect(withJobs.jobs).toHaveLength(1);
    expect(withJobs._count.jobs).toBe(1);

    // relation filter: companies that have some published job
    const hiring = await prisma.company.findMany({ where: { jobs: { some: { status: 'PUBLISHED' } } } });
    expect(hiring).toHaveLength(1);
  });

  it('handles compound-key upsert (userRole) idempotently', async () => {
    await prisma.user.create({ data: { id: 'u1', name: 'U', email: 'u@x.co', status: 'ACTIVE' } });
    const role = await prisma.role.create({ data: { name: 'Root', slug: 'root-admin', system: true } });
    await prisma.userRole.upsert({ where: { userId_roleId: { userId: 'u1', roleId: role.id } }, update: {}, create: { userId: 'u1', roleId: role.id } });
    await prisma.userRole.upsert({ where: { userId_roleId: { userId: 'u1', roleId: role.id } }, update: {}, create: { userId: 'u1', roleId: role.id } });
    const all = await prisma.userRole.findMany({ where: { userId: 'u1' } });
    expect(all).toHaveLength(1);
  });

  it('aggregates sums, counts, and updates with increment', async () => {
    await prisma.payment.create({ data: { orderId: 'o1', userId: 'u1', provider: 'x', amount: 1000, status: 'SUCCESS' } });
    await prisma.payment.create({ data: { orderId: 'o2', userId: 'u1', provider: 'x', amount: 500, status: 'SUCCESS' } });
    const agg = await prisma.payment.aggregate({ where: { status: 'SUCCESS' }, _sum: { amount: true } });
    expect(agg._sum.amount).toBe(1500);
    expect(await prisma.payment.count({ where: { status: 'SUCCESS' } })).toBe(2);

    const job = await prisma.job.create({ data: { title: 'V', slug: 'v', status: 'PUBLISHED', deadline: new Date(), companyId: 'c', creatorId: 'u', type: 'FULL_TIME', responsibilities: 'x', requirements: 'y', views: 0 } });
    await prisma.job.update({ where: { id: job.id }, data: { views: { increment: 1 } } });
    const updated = await prisma.job.findUnique({ where: { id: job.id } });
    expect(updated.views).toBe(1);
  });

  it('performs nested create writes for hasMany relations', async () => {
    const pkg = await prisma.package.create({
      data: { name: 'Featured', slug: 'featured', type: 'JOB', price: 100, features: { create: [{ key: 'tier', value: 'FEATURED' }, { key: 'hot', value: '0' }] } },
      include: { features: true }
    });
    const features = await prisma.packageFeature.findMany({ where: { packageId: pkg.id } });
    expect(features).toHaveLength(2);
  });

  it('orders and paginates', async () => {
    for (let i = 0; i < 5; i++) {
      await prisma.skill.create({ data: { name: `S${i}`, slug: `s${i}`, sortIndex: i } as any });
    }
    const page = await prisma.skill.findMany({ orderBy: { name: 'desc' }, skip: 1, take: 2 });
    expect(page).toHaveLength(2);
    expect(page[0].name).toBe('S3');
  });
});
