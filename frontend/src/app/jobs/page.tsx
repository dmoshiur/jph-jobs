'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { JobCard } from '@/components/JobCard';
import { Pagination } from '@/components/ui/Pagination';
import { ErrorState, LoadingRows, EmptyState } from '@/components/ui/Feedback';
import { api, buildQuery, API_URL } from '@/services/api';
import type { Category, Job, Location, Paginated } from '@/types/api';
import { IconFilter, IconX } from '@/components/ui/Icons';

const TYPES = [
  { v: 'FULL_TIME', l: 'ফুল টাইম' },
  { v: 'PART_TIME', l: 'পার্ট টাইম' },
  { v: 'INTERNSHIP', l: 'ইন্টার্নশিপ' },
  { v: 'CONTRACT', l: 'চুক্তি' },
  { v: 'REMOTE', l: 'রিমোট' }
];
const SALARIES = [
  { v: 10000, l: '৳১০,০০০+' },
  { v: 20000, l: '৳২০,০০০+' },
  { v: 30000, l: '৳৩০,০০০+' },
  { v: 50000, l: '৳৫০,০০০+' }
];
const POSTED = [
  { v: '24h', l: 'গত ২৪ ঘণ্টা' },
  { v: '7d', l: 'গত ৭ দিন' },
  { v: '30d', l: 'গত ৩০ দিন' }
];

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="container section"><LoadingRows /></div>}>
      <JobsContent />
    </Suspense>
  );
}

function JobsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(Number(params.get('page')) || 1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mobileFilter, setMobileFilter] = useState(false);

  const filters = useMemo(() => ({
    q: params.get('q') ?? '',
    location: params.get('location') ?? '',
    category: params.get('category') ?? '',
    type: params.get('type') ?? '',
    salaryMin: params.get('salaryMin') ?? '',
    postedWithin: params.get('postedWithin') ?? '',
    verified: params.get('verified') ?? '',
    featured: params.get('featured') ?? '',
    hot: params.get('hot') ?? '',
    sort: params.get('sort') ?? 'newest'
  }), [params]);

  const setFilter = useCallback((patch: Record<string, string>) => {
    const usp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) usp.set(k, v); else usp.delete(k);
    }
    usp.delete('page');
    setPage(1);
    router.push(`/jobs?${usp.toString()}`);
  }, [params, router]);

  const clearAll = useCallback(() => { router.push('/jobs'); setPage(1); }, [router]);

  useEffect(() => {
    api.get<{ districts: Location[] }>('/public/locations?popular=true').then((d) => setLocations(d.districts)).catch(() => undefined);
    api.get<Category[]>('/public/categories').then(setCategories).catch(() => undefined);
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const query = buildQuery({ ...filters, page, limit: 12 });
      const data = await api.get<Paginated<Job>>(`/jobs${query}`);
      setJobs(data.items); setTotal(data.total); setPages(data.pages);
    } catch (e) { setError(e instanceof Error ? e.message : 'লোড করা যায়নি'); }
    finally { setLoading(false); }
  }, [filters, page]);

  useEffect(() => { void load(); }, [load]);

  const FilterContent = (
    <Filters
      filters={filters}
      setFilter={setFilter}
      locations={locations}
      categories={categories}
      clearAll={clearAll}
    />
  );

  return (
    <div className="container" style={{ paddingTop: 18 }}>
      <nav className="crumb" aria-label="breadcrumb">
        <Link href="/">হোম</Link> <span>/</span> <span>চাকরি</span>
        {filters.q && <><span>/</span><strong>{filters.q}</strong></>}
      </nav>

      <div className="flex items-center justify-between flex-wrap gap-2" style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>
          {filters.q ? <>“{filters.q}” এর চাকরি</> : 'সব চাকরি'}
          {!loading && <span className="muted text-sm" style={{ fontWeight: 400, marginLeft: 8 }}>({total} টি)</span>}
        </h1>
        <div className="flex gap-2 items-center">
          <button className="btn btn-secondary btn-sm filter-toggle-mobile" onClick={() => setMobileFilter(true)}><IconFilter width={15} height={15} /> ফিল্টার</button>
          <label className="text-sm muted" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            সাজান:
            <select value={filters.sort} onChange={(e) => setFilter({ sort: e.target.value })} style={{ width: 'auto', padding: '7px 10px' }}>
              <option value="newest">নতুন আগে</option>
              <option value="deadline">ডেডলাইন</option>
              <option value="salary">বেতন</option>
            </select>
          </label>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px minmax(0,1fr)', gap: 22, alignItems: 'start' }}>
        <div className="sidebar-filters">
          <div className="panel" style={{ position: 'sticky', top: 'calc(var(--header-h) + 80px)' }}>{FilterContent}</div>
        </div>

        <div>
          {loading ? <LoadingRows /> : error ? <ErrorState onRetry={load} /> : jobs.length === 0 ? (
            <EmptyState
              title="কোনো চাকরি পাওয়া যায়নি"
              message="ফিল্টার পরিবর্তন করুন অথবা সব চাকরি ব্রাউজ করুন।"
              action={{ label: 'ফিল্টার মুছুন', onClick: clearAll }}
            />
          ) : (
            <div className="grid grid-2">
              {jobs.map((j) => <JobCard key={j.id} job={j} />)}
            </div>
          )}
          <Pagination page={page} pages={pages} onPage={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFilter && (
        <div className="drawer-backdrop open" onClick={() => setMobileFilter(false)}>
          <div className="filter-drawer open" onClick={(e) => e.stopPropagation()} style={{ transform: 'translateX(0)' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>ফিল্টার</h2>
              <button className="m-icon-btn" onClick={() => setMobileFilter(false)} aria-label="বন্ধ"><IconX width={20} height={20} /></button>
            </div>
            {FilterContent}
            <button className="btn btn-block mt-4" onClick={() => setMobileFilter(false)}>ফলাফল দেখুন</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Filters({
  filters, setFilter, locations, categories, clearAll
}: {
  filters: Record<string, string>;
  setFilter: (p: Record<string, string>) => void;
  locations: Location[];
  categories: Category[];
  clearAll: () => void;
}) {
  return (
    <div style={{ padding: 8 }}>
      <div className="flex items-center justify-between" style={{ padding: '6px 8px 12px' }}>
        <strong>ফিল্টার</strong>
        <button className="btn btn-ghost btn-sm" onClick={clearAll} style={{ padding: 4, color: 'var(--primary-600)' }}>মুছুন</button>
      </div>

      <div className="filter-group">
        <h4>লোকেশন</h4>
        <select value={filters.location} onChange={(e) => setFilter({ location: e.target.value })}>
          <option value="">বগুড়া ও জয়পুরহাট</option>
          {locations.map((d) => (
            <optgroup key={d.id} label={d.name}>
              <option value={d.slug}>{d.name} (সব)</option>
              {d.children?.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <h4>ক্যাটাগরি</h4>
        <select value={filters.category} onChange={(e) => setFilter({ category: e.target.value })}>
          <option value="">সব ক্যাটাগরি</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
      </div>

      <div className="filter-group">
        <h4>চাকরির ধরন</h4>
        {TYPES.map((t) => (
          <label key={t.v} className="check-row">
            <input type="radio" name="type" checked={filters.type === t.v} onChange={() => setFilter({ type: filters.type === t.v ? '' : t.v })} /> {t.l}
          </label>
        ))}
      </div>

      <div className="filter-group">
        <h4>বেতন</h4>
        {SALARIES.map((s) => (
          <label key={s.v} className="check-row">
            <input type="radio" name="salary" checked={filters.salaryMin === String(s.v)} onChange={() => setFilter({ salaryMin: filters.salaryMin === String(s.v) ? '' : String(s.v) })} /> {s.l}
          </label>
        ))}
      </div>

      <div className="filter-group">
        <h4>পোস্টের সময়</h4>
        {POSTED.map((p) => (
          <label key={p.v} className="check-row">
            <input type="radio" name="posted" checked={filters.postedWithin === p.v} onChange={() => setFilter({ postedWithin: filters.postedWithin === p.v ? '' : p.v })} /> {p.l}
          </label>
        ))}
      </div>

      <div className="filter-group">
        <h4>শুধুমাত্র</h4>
        <label className="check-row"><input type="checkbox" checked={filters.verified === 'true'} onChange={(e) => setFilter({ verified: e.target.checked ? 'true' : '' })} /> ভেরিফাইড কোম্পানি</label>
        <label className="check-row"><input type="checkbox" checked={filters.featured === 'true'} onChange={(e) => setFilter({ featured: e.target.checked ? 'true' : '' })} /> ফিচার্ড চাকরি</label>
        <label className="check-row"><input type="checkbox" checked={filters.hot === 'true'} onChange={(e) => setFilter({ hot: e.target.checked ? 'true' : '' })} /> জরুরি নিয়োগ</label>
      </div>
    </div>
  );
}
