/**
 * Firestore-backed, Prisma-compatible query engine.
 *
 * This module exposes a `prisma`-shaped client whose delegates
 * (prisma.user, prisma.job, ...) implement the subset of the Prisma Client API
 * the application uses — but every read/write is executed against Cloud
 * Firestore instead of PostgreSQL. This lets the existing modules keep their
 * expressive queries (where operators, include, _count, orderBy, aggregate,
 * groupBy, nested writes, transactions) with no SQL anywhere in the stack.
 *
 * Design notes / tradeoffs:
 *  - Filtering, sorting, relation resolution and pagination are performed in the
 *    application layer after loading the relevant collection(s). For a regional
 *    jobs marketplace this is simple and correct; for very large collections you
 *    would add Firestore composite indexes and push predicates down.
 *  - Firestore Timestamps are converted back to JS `Date` on read so callers can
 *    use `new Date(x)` and date comparisons exactly as before.
 *  - Join tables with composite primary keys use deterministic document ids so
 *    `upsert`/uniqueness behave like Prisma's compound unique keys.
 */
import { nanoid } from 'nanoid';
import { firestore } from '../firebase/admin.js';
import { MODELS, type ModelDef, type Relation } from './models.js';
import { ApiError } from '../utils/errors.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Models whose document id is derived from a composite key (Prisma @@id([...])).
const COMPOUND_ID: Record<string, string[]> = {
  userRole: ['userId', 'roleId'],
  rolePermission: ['roleId', 'permissionId'],
  candidateSkill: ['candidateId', 'skillId'],
  jobSkill: ['jobId', 'skillId'],
  savedJob: ['userId', 'jobId']
};

// Composite unique keys usable in `where` (Prisma exposes them as `a_b`).
const COMPOUND_KEYS: Record<string, string[][]> = {
  userRole: [['userId', 'roleId']],
  rolePermission: [['roleId', 'permissionId']],
  candidateSkill: [['candidateId', 'skillId']],
  jobSkill: [['jobId', 'skillId']],
  savedJob: [['userId', 'jobId']],
  companyMember: [['companyId', 'userId']]
};

const OPERATORS = new Set([
  'in', 'notIn', 'not', 'gt', 'gte', 'lt', 'lte', 'contains', 'startsWith', 'endsWith', 'equals', 'mode'
]);
const RELATION_FILTERS = new Set(['is', 'isNot', 'some', 'none', 'every']);

type Ctx = { cache: Map<string, any[]> };
const newCtx = (): Ctx => ({ cache: new Map() });

function def(model: string): ModelDef {
  const d = MODELS[model];
  if (!d) throw new Error(`Unknown model: ${model}`);
  return d;
}

// ---- value helpers -------------------------------------------------------

function isTimestamp(v: any): boolean {
  return v && typeof v === 'object' && typeof v.toDate === 'function';
}

/** Convert Firestore Timestamps to JS Dates recursively (read path). */
function deserialize(value: any): any {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value;
  if (isTimestamp(value)) return value.toDate();
  if (Array.isArray(value)) return value.map(deserialize);
  if (typeof value === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(value)) out[k] = deserialize(v);
    return out;
  }
  return value;
}

function toComparable(v: any): any {
  if (v === null || v === undefined) return v;
  if (v instanceof Date) return v.getTime();
  if (isTimestamp(v)) return v.toDate().getTime();
  if (typeof v === 'string') {
    // ISO date strings compare fine lexicographically, keep as-is.
    return v;
  }
  return v;
}

function eq(a: any, b: any): boolean {
  const ca = toComparable(a);
  const cb = toComparable(b);
  return ca === cb;
}

function cmp(a: any, b: any): number {
  const ca = toComparable(a);
  const cb = toComparable(b);
  if (ca === cb) return 0;
  if (ca === null || ca === undefined) return -1;
  if (cb === null || cb === undefined) return 1;
  return ca < cb ? -1 : 1;
}

function matchScalar(fieldValue: any, cond: any): boolean {
  if (cond === null) return fieldValue === null || fieldValue === undefined;
  if (typeof cond !== 'object' || cond instanceof Date || Array.isArray(cond)) {
    return eq(fieldValue, cond);
  }
  // operator object
  const mode = cond.mode;
  const str = (x: any) => (typeof x === 'string' ? (mode === 'insensitive' ? x.toLowerCase() : x) : x);
  for (const [op, val] of Object.entries(cond)) {
    switch (op) {
      case 'mode':
        break;
      case 'equals':
        if (!eq(fieldValue, val)) return false;
        break;
      case 'not':
        if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
          if (matchScalar(fieldValue, val)) return false;
        } else if (eq(fieldValue, val)) return false;
        break;
      case 'in':
        if (!Array.isArray(val) || !val.some((v) => eq(fieldValue, v))) return false;
        break;
      case 'notIn':
        if (Array.isArray(val) && val.some((v) => eq(fieldValue, v))) return false;
        break;
      case 'gt':
        if (!(cmp(fieldValue, val) > 0)) return false;
        break;
      case 'gte':
        if (!(cmp(fieldValue, val) >= 0)) return false;
        break;
      case 'lt':
        if (!(cmp(fieldValue, val) < 0)) return false;
        break;
      case 'lte':
        if (!(cmp(fieldValue, val) <= 0)) return false;
        break;
      case 'contains':
        if (typeof fieldValue !== 'string' || !str(fieldValue).includes(str(val))) return false;
        break;
      case 'startsWith':
        if (typeof fieldValue !== 'string' || !str(fieldValue).startsWith(str(val))) return false;
        break;
      case 'endsWith':
        if (typeof fieldValue !== 'string' || !str(fieldValue).endsWith(str(val))) return false;
        break;
      default:
        // Unknown operator — be conservative.
        return false;
    }
  }
  return true;
}

// ---- collection loading --------------------------------------------------

async function loadAll(model: string, ctx: Ctx): Promise<any[]> {
  const d = def(model);
  if (ctx.cache.has(d.collection)) return ctx.cache.get(d.collection)!;
  const snap = await firestore().collection(d.collection).get();
  const docs = snap.docs.map((doc) => deserialize({ id: doc.id, ...doc.data() }));
  ctx.cache.set(d.collection, docs);
  return docs;
}

// ---- where evaluation ----------------------------------------------------

async function matchWhere(model: string, doc: any, where: any, ctx: Ctx): Promise<boolean> {
  if (!where || Object.keys(where).length === 0) return true;
  const d = def(model);

  for (const [key, cond] of Object.entries<any>(where)) {
    if (key === 'AND') {
      const arr = Array.isArray(cond) ? cond : [cond];
      for (const sub of arr) if (!(await matchWhere(model, doc, sub, ctx))) return false;
      continue;
    }
    if (key === 'OR') {
      const arr = Array.isArray(cond) ? cond : [cond];
      let any = false;
      for (const sub of arr) if (await matchWhere(model, doc, sub, ctx)) { any = true; break; }
      if (!any) return false;
      continue;
    }
    if (key === 'NOT') {
      const arr = Array.isArray(cond) ? cond : [cond];
      for (const sub of arr) if (await matchWhere(model, doc, sub, ctx)) return false;
      continue;
    }

    // Compound unique key (e.g. userId_roleId: { userId, roleId })
    const compound = (COMPOUND_KEYS[model] || []).find((fields) => fields.join('_') === key);
    if (compound && cond && typeof cond === 'object') {
      if (!compound.every((f) => eq(doc[f], cond[f]))) return false;
      continue;
    }

    const relation = d.relations[key];
    if (relation) {
      if (!(await matchRelation(model, doc, relation, cond, ctx))) return false;
      continue;
    }

    // scalar field
    if (!matchScalar(doc[key], cond)) return false;
  }
  return true;
}

async function matchRelation(
  parentModel: string,
  doc: any,
  relation: Relation,
  cond: any,
  ctx: Ctx
): Promise<boolean> {
  const related = await resolveRelation(parentModel, doc, relation, ctx);

  if (relation.kind === 'hasMany') {
    const list: any[] = related || [];
    if (cond && typeof cond === 'object' && Object.keys(cond).some((k) => RELATION_FILTERS.has(k))) {
      if ('some' in cond) {
        for (const item of list) if (await matchWhere(relation.model, item, cond.some, ctx)) return true;
        return false;
      }
      if ('every' in cond) {
        for (const item of list) if (!(await matchWhere(relation.model, item, cond.every, ctx))) return false;
        return true;
      }
      if ('none' in cond) {
        for (const item of list) if (await matchWhere(relation.model, item, cond.none, ctx)) return false;
        return true;
      }
    }
    // bare object → treat as `some`
    for (const item of list) if (await matchWhere(relation.model, item, cond, ctx)) return true;
    return false;
  }

  // belongsTo / hasOne
  const single = related as any;
  if (cond && typeof cond === 'object' && ('is' in cond || 'isNot' in cond)) {
    if ('is' in cond) {
      if (cond.is === null) return !single;
      return single ? await matchWhere(relation.model, single, cond.is, ctx) : false;
    }
    if ('isNot' in cond) {
      if (cond.isNot === null) return !!single;
      return single ? !(await matchWhere(relation.model, single, cond.isNot, ctx)) : true;
    }
  }
  if (cond === null) return !single;
  return single ? await matchWhere(relation.model, single, cond, ctx) : false;
}

async function resolveRelation(parentModel: string, doc: any, relation: Relation, ctx: Ctx): Promise<any> {
  const targetDocs = await loadAll(relation.model, ctx);
  if (relation.kind === 'belongsTo') {
    const fk = doc[relation.localField!];
    if (fk === null || fk === undefined) return null;
    return targetDocs.find((t) => eq(t.id, fk)) ?? null;
  }
  if (relation.kind === 'hasOne') {
    return targetDocs.find((t) => eq(t[relation.foreignField!], doc.id)) ?? null;
  }
  // hasMany
  return targetDocs.filter((t) => eq(t[relation.foreignField!], doc.id));
}

// ---- include / select resolution ----------------------------------------

async function project(
  model: string,
  doc: any,
  opts: { include?: any; select?: any },
  ctx: Ctx
): Promise<any> {
  const d = def(model);
  let out: any;

  if (opts.select) {
    out = {};
    for (const [key, val] of Object.entries<any>(opts.select)) {
      if (!val) continue;
      if (key === '_count') {
        out._count = await computeCount(model, doc, val.select ?? val, ctx);
        continue;
      }
      const relation = d.relations[key];
      if (relation) {
        out[key] = await resolveWithNested(model, doc, key, relation, val, ctx);
      } else {
        out[key] = doc[key];
      }
    }
    // Always expose id when selecting relations/fields, matching Prisma when id selected explicitly only.
    return out;
  }

  // include (or plain): start from full scalar doc
  out = { ...doc };
  if (opts.include) {
    for (const [key, val] of Object.entries<any>(opts.include)) {
      if (!val) continue;
      if (key === '_count') {
        out._count = await computeCount(model, doc, val.select ?? val, ctx);
        continue;
      }
      const relation = d.relations[key];
      if (relation) {
        out[key] = await resolveWithNested(model, doc, key, relation, val, ctx);
      }
    }
  }
  return out;
}

async function resolveWithNested(
  parentModel: string,
  doc: any,
  key: string,
  relation: Relation,
  spec: any,
  ctx: Ctx
): Promise<any> {
  const nested = spec && typeof spec === 'object' ? spec : {};
  const related = await resolveRelation(parentModel, doc, relation, ctx);

  if (relation.kind === 'hasMany') {
    let list: any[] = related || [];
    if (nested.where) {
      const filtered: any[] = [];
      for (const item of list) if (await matchWhere(relation.model, item, nested.where, ctx)) filtered.push(item);
      list = filtered;
    }
    if (nested.orderBy) list = await sortDocs(relation.model, list, nested.orderBy, ctx);
    if (typeof nested.skip === 'number') list = list.slice(nested.skip);
    if (typeof nested.take === 'number') list = list.slice(0, nested.take);
    const projected: any[] = [];
    for (const item of list) projected.push(await project(relation.model, item, nested, ctx));
    return projected;
  }

  if (!related) return null;
  return project(relation.model, related, nested, ctx);
}

async function computeCount(model: string, doc: any, select: any, ctx: Ctx): Promise<any> {
  const d = def(model);
  const out: any = {};
  for (const [key, spec] of Object.entries<any>(select)) {
    if (!spec) continue;
    const relation = d.relations[key];
    if (!relation || relation.kind !== 'hasMany') { out[key] = 0; continue; }
    let list = await resolveRelation(model, doc, relation, ctx);
    if (spec && typeof spec === 'object' && spec.where) {
      const filtered: any[] = [];
      for (const item of list) if (await matchWhere(relation.model, item, spec.where, ctx)) filtered.push(item);
      list = filtered;
    }
    out[key] = list.length;
  }
  return out;
}

// ---- ordering ------------------------------------------------------------

async function sortDocs(model: string, docs: any[], orderBy: any, ctx: Ctx): Promise<any[]> {
  const specs = Array.isArray(orderBy) ? orderBy : [orderBy];
  const d = def(model);

  // Precompute relation-count keys where needed.
  const countCache = new Map<string, Map<string, number>>();
  for (const spec of specs) {
    for (const [key, val] of Object.entries<any>(spec)) {
      const relation = d.relations[key];
      if (relation && val && typeof val === 'object' && '_count' in val) {
        const m = new Map<string, number>();
        for (const doc of docs) {
          const list = await resolveRelation(model, doc, relation, ctx);
          m.set(doc.id, (list || []).length);
        }
        countCache.set(key, m);
      }
    }
  }

  const arr = [...docs];
  arr.sort((a, b) => {
    for (const spec of specs) {
      for (const [key, val] of Object.entries<any>(spec)) {
        let diff = 0;
        if (countCache.has(key)) {
          const m = countCache.get(key)!;
          diff = (m.get(a.id) ?? 0) - (m.get(b.id) ?? 0);
          if ((val as any)._count === 'desc') diff = -diff;
        } else {
          diff = cmp(a[key], b[key]);
          if (val === 'desc') diff = -diff;
        }
        if (diff !== 0) return diff;
      }
    }
    return 0;
  });
  return arr;
}

// ---- write helpers -------------------------------------------------------

function genId(model: string, data: any): string {
  const compound = COMPOUND_ID[model];
  if (compound) return compound.map((f) => data[f]).join('__');
  return nanoid(20);
}

function splitNestedWrites(model: string, data: any): { scalars: any; nested: Array<{ relation: Relation; spec: any }> } {
  const d = def(model);
  const scalars: any = {};
  const nested: Array<{ relation: Relation; spec: any }> = [];
  for (const [key, val] of Object.entries<any>(data)) {
    const relation = d.relations[key];
    if (relation && val && typeof val === 'object' && ('create' in val || 'createMany' in val || 'connect' in val || 'deleteMany' in val || 'set' in val)) {
      nested.push({ relation, spec: val });
    } else {
      scalars[key] = val;
    }
  }
  return { scalars, nested };
}

function applyDefaults(model: string, data: any): any {
  const d = def(model);
  const out: any = { ...data };
  if (d.defaults) {
    for (const [k, v] of Object.entries(d.defaults)) {
      if (out[k] === undefined) out[k] = v;
    }
  }
  return out;
}

async function performNestedWrites(parentModel: string, parentId: string, nested: Array<{ relation: Relation; spec: any }>, tx: FirestoreOrm) {
  for (const { relation, spec } of nested) {
    if (relation.kind !== 'hasMany') continue;
    const childDelegate = tx.delegate(relation.model);
    if (spec.create) {
      const items = Array.isArray(spec.create) ? spec.create : [spec.create];
      for (const item of items) {
        await childDelegate.create({ data: { ...item, [relation.foreignField!]: parentId } });
      }
    }
    if (spec.createMany) {
      const items = spec.createMany.data ?? [];
      await childDelegate.createMany({
        data: items.map((i: any) => ({ ...i, [relation.foreignField!]: parentId })),
        skipDuplicates: spec.createMany.skipDuplicates
      });
    }
  }
}

// ---- delegate ------------------------------------------------------------

class ModelDelegate {
  constructor(private model: string, private orm: FirestoreOrm) {}

  private col() {
    return firestore().collection(def(this.model).collection);
  }

  async findMany(args: any = {}, ctx: Ctx = newCtx()): Promise<any[]> {
    let docs = await loadAll(this.model, ctx);
    if (args.where) {
      const filtered: any[] = [];
      for (const doc of docs) if (await matchWhere(this.model, doc, args.where, ctx)) filtered.push(doc);
      docs = filtered;
    }
    if (args.orderBy) docs = await sortDocs(this.model, docs, args.orderBy, ctx);
    if (typeof args.skip === 'number') docs = docs.slice(args.skip);
    if (typeof args.take === 'number') docs = docs.slice(0, args.take);
    const out: any[] = [];
    for (const doc of docs) out.push(await project(this.model, doc, args, ctx));
    return out;
  }

  async findFirst(args: any = {}, ctx: Ctx = newCtx()): Promise<any | null> {
    const rows = await this.findMany({ ...args, take: 1 }, ctx);
    return rows[0] ?? null;
  }

  async findUnique(args: any = {}, ctx: Ctx = newCtx()): Promise<any | null> {
    return this.findFirst(args, ctx);
  }

  async findUniqueOrThrow(args: any = {}, ctx: Ctx = newCtx()): Promise<any> {
    const row = await this.findFirst(args, ctx);
    if (!row) throw new ApiError(404, `${this.model} not found`);
    return row;
  }

  async findFirstOrThrow(args: any = {}, ctx: Ctx = newCtx()): Promise<any> {
    const row = await this.findFirst(args, ctx);
    if (!row) throw new ApiError(404, `${this.model} not found`);
    return row;
  }

  async count(args: any = {}, ctx: Ctx = newCtx()): Promise<number> {
    let docs = await loadAll(this.model, ctx);
    if (args.where) {
      let n = 0;
      for (const doc of docs) if (await matchWhere(this.model, doc, args.where, ctx)) n++;
      return n;
    }
    return docs.length;
  }

  async aggregate(args: any = {}, ctx: Ctx = newCtx()): Promise<any> {
    const rows = await this.findMany({ where: args.where }, ctx);
    const result: any = {};
    if (args._sum) {
      result._sum = {};
      for (const field of Object.keys(args._sum)) {
        result._sum[field] = rows.reduce((acc, r) => acc + (Number(r[field]) || 0), 0);
      }
    }
    if (args._count) {
      result._count = typeof args._count === 'object'
        ? Object.fromEntries(Object.keys(args._count).map((k) => [k, rows.length]))
        : rows.length;
    }
    if (args._avg) {
      result._avg = {};
      for (const field of Object.keys(args._avg)) {
        result._avg[field] = rows.length ? rows.reduce((a, r) => a + (Number(r[field]) || 0), 0) / rows.length : null;
      }
    }
    return result;
  }

  async groupBy(args: any = {}, ctx: Ctx = newCtx()): Promise<any[]> {
    const rows = await this.findMany({ where: args.where }, ctx);
    const by: string[] = args.by ?? [];
    const groups = new Map<string, { key: any; items: any[] }>();
    for (const row of rows) {
      const keyObj: any = {};
      for (const f of by) keyObj[f] = row[f] ?? null;
      const k = JSON.stringify(keyObj);
      if (!groups.has(k)) groups.set(k, { key: keyObj, items: [] });
      groups.get(k)!.items.push(row);
    }
    let result = [...groups.values()].map(({ key, items }) => {
      const entry: any = { ...key };
      if (args._count) {
        entry._count = typeof args._count === 'object'
          ? Object.fromEntries(Object.keys(args._count).map((f) => [f, items.length]))
          : items.length;
      }
      if (args._sum) {
        entry._sum = Object.fromEntries(Object.keys(args._sum).map((f) => [f, items.reduce((a, r) => a + (Number(r[f]) || 0), 0)]));
      }
      return entry;
    });
    if (args.orderBy) {
      const spec = Array.isArray(args.orderBy) ? args.orderBy[0] : args.orderBy;
      const [field, dir] = Object.entries<any>(spec)[0];
      result.sort((a, b) => {
        const av = field === '_count' ? valOfCount(a._count, dir) : a[field];
        const bv = field === '_count' ? valOfCount(b._count, dir) : b[field];
        let d = cmp(field === '_count' ? countNum(a._count) : av, field === '_count' ? countNum(b._count) : bv);
        const direction = field === '_count' ? Object.values<any>(dir)[0] : dir;
        if (direction === 'desc') d = -d;
        return d;
      });
    }
    if (typeof args.take === 'number') result = result.slice(0, args.take);
    return result;
  }

  async create(args: any, ctx: Ctx = newCtx()): Promise<any> {
    const { scalars, nested } = splitNestedWrites(this.model, args.data ?? {});
    const withDefaults = applyDefaults(this.model, scalars);
    const id = withDefaults.id ?? genId(this.model, withDefaults);
    const now = new Date();
    const record: any = { ...withDefaults, id };
    if (def(this.model).timestamps) {
      if (record.createdAt === undefined) record.createdAt = now;
      record.updatedAt = now;
    }
    delete (record as any).id;
    await this.col().doc(id).set(stripUndefined(record));
    ctx.cache.delete(def(this.model).collection);
    if (nested.length) await performNestedWrites(this.model, id, nested, this.orm);
    const full = { id, ...record };
    return project(this.model, deserialize(full), args, ctx);
  }

  async createMany(args: any, _ctx: Ctx = newCtx()): Promise<{ count: number }> {
    const items: any[] = args.data ?? [];
    let count = 0;
    const batchSize = 400;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = firestore().batch();
      for (const raw of items.slice(i, i + batchSize)) {
        const withDefaults = applyDefaults(this.model, raw);
        const id = withDefaults.id ?? genId(this.model, withDefaults);
        if (args.skipDuplicates && COMPOUND_ID[this.model]) {
          const existing = await this.col().doc(id).get();
          if (existing.exists) continue;
        }
        const now = new Date();
        const record: any = { ...withDefaults };
        delete record.id;
        if (def(this.model).timestamps) { record.createdAt = record.createdAt ?? now; record.updatedAt = now; }
        batch.set(this.col().doc(id), stripUndefined(record));
        count++;
      }
      await batch.commit();
    }
    return { count };
  }

  async update(args: any, ctx: Ctx = newCtx()): Promise<any> {
    const target = await this.findFirst({ where: args.where }, ctx);
    if (!target) throw new ApiError(404, `${this.model} not found`);
    const { scalars, nested } = splitNestedWrites(this.model, args.data ?? {});
    const patch = applyIncrements(target, scalars);
    if (def(this.model).timestamps) patch.updatedAt = new Date();
    await this.col().doc(target.id).set(stripUndefined(patch), { merge: true });
    ctx.cache.delete(def(this.model).collection);
    if (nested.length) await performNestedWrites(this.model, target.id, nested, this.orm);
    const merged = { ...target, ...patch };
    return project(this.model, deserialize(merged), args, ctx);
  }

  async updateMany(args: any, ctx: Ctx = newCtx()): Promise<{ count: number }> {
    const targets = await this.findMany({ where: args.where }, ctx);
    for (const t of targets) {
      const patch = applyIncrements(t, args.data ?? {});
      if (def(this.model).timestamps) patch.updatedAt = new Date();
      await this.col().doc(t.id).set(stripUndefined(patch), { merge: true });
    }
    ctx.cache.delete(def(this.model).collection);
    return { count: targets.length };
  }

  async upsert(args: any, ctx: Ctx = newCtx()): Promise<any> {
    const existing = await this.findFirst({ where: args.where }, ctx);
    if (existing) return this.update({ where: args.where, data: args.update, include: args.include, select: args.select }, ctx);
    return this.create({ data: { ...args.create }, include: args.include, select: args.select }, ctx);
  }

  async delete(args: any, ctx: Ctx = newCtx()): Promise<any> {
    const target = await this.findFirst({ where: args.where }, ctx);
    if (!target) throw new ApiError(404, `${this.model} not found`);
    await this.col().doc(target.id).delete();
    ctx.cache.delete(def(this.model).collection);
    return target;
  }

  async deleteMany(args: any = {}, ctx: Ctx = newCtx()): Promise<{ count: number }> {
    const targets = await this.findMany({ where: args.where }, ctx);
    for (const t of targets) await this.col().doc(t.id).delete();
    ctx.cache.delete(def(this.model).collection);
    return { count: targets.length };
  }
}

function countNum(count: any): number {
  if (typeof count === 'number') return count;
  if (count && typeof count === 'object') return Number(Object.values(count)[0] ?? 0);
  return 0;
}
function valOfCount(count: any, _dir: any): number { return countNum(count); }

function stripUndefined(obj: any): any {
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v;
  return out;
}

function applyIncrements(target: any, data: any): any {
  const out: any = {};
  for (const [k, v] of Object.entries<any>(data)) {
    if (v && typeof v === 'object' && !(v instanceof Date) && !Array.isArray(v) && ('increment' in v || 'decrement' in v || 'set' in v)) {
      if ('increment' in v) out[k] = (Number(target[k]) || 0) + Number(v.increment);
      else if ('decrement' in v) out[k] = (Number(target[k]) || 0) - Number(v.decrement);
      else out[k] = v.set;
    } else {
      out[k] = v;
    }
  }
  return out;
}

// ---- client --------------------------------------------------------------

export class FirestoreOrm {
  private delegates = new Map<string, ModelDelegate>();

  delegate(model: string): ModelDelegate {
    if (!this.delegates.has(model)) this.delegates.set(model, new ModelDelegate(model, this));
    return this.delegates.get(model)!;
  }

  async $transaction(arg: any): Promise<any> {
    // Callback form: run against this same client (best-effort sequential).
    if (typeof arg === 'function') return arg(this);
    // Array form: the operations are already executing promises.
    return Promise.all(arg);
  }

  async $disconnect(): Promise<void> {
    /* no persistent connection to close */
  }
}

function buildClient(): any {
  const orm = new FirestoreOrm();
  const client: any = {
    $transaction: (arg: any) => orm.$transaction(arg),
    $disconnect: () => orm.$disconnect()
  };
  for (const model of Object.keys(MODELS)) {
    const delegate = orm.delegate(model);
    client[model] = {
      findMany: (a?: any) => delegate.findMany(a),
      findFirst: (a?: any) => delegate.findFirst(a),
      findUnique: (a?: any) => delegate.findUnique(a),
      findUniqueOrThrow: (a?: any) => delegate.findUniqueOrThrow(a),
      findFirstOrThrow: (a?: any) => delegate.findFirstOrThrow(a),
      count: (a?: any) => delegate.count(a),
      aggregate: (a?: any) => delegate.aggregate(a),
      groupBy: (a?: any) => delegate.groupBy(a),
      create: (a: any) => delegate.create(a),
      createMany: (a: any) => delegate.createMany(a),
      update: (a: any) => delegate.update(a),
      updateMany: (a: any) => delegate.updateMany(a),
      upsert: (a: any) => delegate.upsert(a),
      delete: (a: any) => delegate.delete(a),
      deleteMany: (a?: any) => delegate.deleteMany(a)
    };
  }
  return client;
}

export const orm = buildClient();
