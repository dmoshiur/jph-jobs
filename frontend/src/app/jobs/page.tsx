'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { JobListCard } from '@/components/jobs/JobListCard';
import { Pagination } from '@/components/ui/Pagination';
import { ErrorState, LoadingRows, EmptyState } from '@/components/ui/Feedback';
import { api, buildQuery } from '@/services/api';
import { DEMO_CATEGORIES, DEMO_LOCATIONS, DEMO_STATS, filterDemoJobs, vacanciesOf } from '@/lib/demo-data';
import { formatCount } from '@/lib/format';
import { useLang } from '@/hooks/useLang';
import { IconFilter, IconX } from '@/components/ui/Icons';
import { DEMO_COURSES } from '@/lib/demo-data';
import type { Category, Job, Location, Paginated } from '@/types/api';

const TYPES = [
  { v: 'FULL_TIME', l: 'Full Time' },
  { v: 'PART_TIME', l: 'Part Time' },
  { v: 'INTERNSHIP', l: 'Internship' },
  { v: 'CONTRACT', l: 'Contractual' },
  { v: 'REMOTE', l: 'Work From Home' },
  { v: 'govt', l: 'Government' },
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
  const { lang } = useLang();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [vacancies, setVacancies] = useState(DEMO_STATS.vacancies);
  const [page, setPage] = useState(Number(params.get('page')) || 1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [locations, setLocations] = useState<Location[]>(DEMO_LOCATIONS);
  const [categories, setCategories] = useState<Category[]>(DEMO_CATEGORIES);
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
    sort: params.get('sort') ?? 'newest',
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
    api.get<{ districts: Location[] }>('/public/locations?popular=true')
      .then((d) => { if (d.districts?.length) setLocations(d.districts); })
      .catch(() => undefined);
    api.get<Category[]>('/public/categories')
      .then((c) => { if (c.length) setCategories(c); })
      .catch(() => undefined);
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const query = buildQuery({ ...filters, page, limit: 12 });
      const data = await api.get<Paginated<Job>>(`/jobs${query}`);
      if (data.items?.length) {
        setJobs(data.items);
        setTotal(data.total);
        setPages(data.pages);
        setVacancies(vacanciesOf(data.items) * Math.max(1, Math.round(data.total / Math.max(1, data.items.length))));
        return;
      }
      throw new Error('empty');
    } catch {
      const demo = filterDemoJobs({ ...filters, page, limit: 12 });
      setJobs(demo.items);
      setTotal(demo.total);
      setPages(demo.pages);
      setVacancies(Math.max(DEMO_STATS.vacancies, vacanciesOf(demo.items)));
      setError('');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { void load(); }, [load]);

  const active: { key: string; label: string }[] = [];
  if (filters.q) active.push({ key: 'q', label: filters.q });
  if (filters.category) {
    const c = categories.find((x) => x.slug === filters.category);
    active.push({ key: 'category', label: c?.name || filters.category });
  }
  if (filters.location) {
    const l = locations.find((x) => x.slug === filters.location);
    active.push({ key: 'location', label: filters.location === '-2' ? 'Overseas' : (l?.name || filters.location) });
  }
  if (filters.type) {
    const t = TYPES.find((x) => x.v === filters.type);
    active.push({ key: 'type', label: t?.l || filters.type });
  }

  const FilterContent = (
    <Filters filters={filters} setFilter={setFilter} locations={locations} categories={categories} clearAll={clearAll} />
  );

  return (
    <div className="container bdj-jobs-page">
      <nav className="crumb" aria-label="breadcrumb">
        <Link href="/">Home</Link> <span>/</span> <span>Jobs</span>
      </nav>

      <div className="bdj-countbar">
        <h1>
          {formatCount(total || DEMO_STATS.liveJobs, lang)} Jobs
          <span className="pipe">|</span>
          <span className="vac">{formatCount(vacancies, lang)}+ Vacancies</span>
        </h1>
        <div className="flex gap-2 items-center">
          <button className="btn btn-secondary btn-sm filter-toggle-mobile" onClick={() => setMobileFilter(true)}>
            <IconFilter width={15} height={15} /> Filter
          </button>
          <label className="text-sm muted" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            Sort:
            <select value={filters.sort} onChange={(e) => setFilter({ sort: e.target.value })} style={{ width: 'auto', padding: '7px 10px' }}>
              <option value="newest">Newest</option>
              <option value="deadline">Deadline</option>
              <option value="salary">Salary</option>
            </select>
          </label>
        </div>
      </div>

      {active.length > 0 && (
        <div className="bdj-active-filters">
          <span className="text-sm muted">Active Filter:</span>
          {active.map((a) => (
            <span key={a.key} className="bdj-chip-x">
              {a.label}
              <button type="button" onClick={() => setFilter({ [a.key]: '' })} aria-label="Remove">×</button>
            </span>
          ))}
          <button type="button" className="btn btn-ghost btn-sm" onClick={clearAll}>Clear</button>
        </div>
      )}

      <div className="bdj-jobs-layout">
        <div className="sidebar-filters">
          <div className="bdj-filter-panel">{FilterContent}</div>
        </div>

        <div>
          {loading ? <LoadingRows /> : error ? <ErrorState onRetry={load} /> : jobs.length === 0 ? (
            <EmptyState
              title="No jobs found"
              message="Try another keyword or clear filters."
              action={{ label: 'Clear filters', onClick: clearAll }}
            />
          ) : (
            <div className="bdj-list">
              {jobs.map((j) => <JobListCard key={j.id} job={j} />)}
            </div>
          )}
          <Pagination page={page} pages={pages} onPage={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />

          <aside className="mt-6">
            <h3 style={{ fontSize: '1rem', marginBottom: 10 }}>E-LEARNING</h3>
            <div className="grid" style={{ gap: 10 }}>
              {DEMO_COURSES.map((c) => (
                <Link key={c.title} href="/training" className="elearn-card">
                  <h4>{c.title}</h4>
                  <p>{c.price} · {c.instructor}</p>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </div>

      {mobileFilter && (
        <div className="drawer-backdrop open" onClick={() => setMobileFilter(false)}>
          <div className="filter-drawer open" onClick={(e) => e.stopPropagation()} style={{ transform: 'translateX(0)' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Filter</h2>
              <button className="bdj-icon-btn" onClick={() => setMobileFilter(false)} aria-label="Close"><IconX width={18} height={18} /></button>
            </div>
            {FilterContent}
            <button className="btn btn-block mt-4" onClick={() => setMobileFilter(false)}>Show results</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Filters({
  filters, setFilter, locations, categories, clearAll,
}: {
  filters: Record<string, string>;
  setFilter: (p: Record<string, string>) => void;
  locations: Location[];
  categories: Category[];
  clearAll: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between" style={{ padding: '12px 14px 4px' }}>
        <strong>Filter</strong>
        <button className="btn btn-ghost btn-sm" onClick={clearAll} style={{ padding: 4, color: 'var(--bdj-blue)' }}>Clear</button>
      </div>

      <div className="filter-group">
        <h4>Keyword</h4>
        <input
          defaultValue={filters.q}
          placeholder="Job title or skill"
          onKeyDown={(e) => {
            if (e.key === 'Enter') setFilter({ q: (e.target as HTMLInputElement).value });
          }}
        />
      </div>

      <div className="filter-group">
        <h4>Location</h4>
        <select value={filters.location} onChange={(e) => setFilter({ location: e.target.value })}>
          <option value="">All Bangladesh</option>
          <option value="-2">Overseas</option>
          {locations.map((d) => <option key={d.id} value={d.slug}>{d.name}</option>)}
        </select>
      </div>

      <div className="filter-group">
        <h4>Category</h4>
        <select value={filters.category} onChange={(e) => setFilter({ category: e.target.value })}>
          <option value="">All Category</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
      </div>

      <div className="filter-group">
        <h4>Job Type</h4>
        {TYPES.map((t) => (
          <label key={t.v} className="check-row">
            <input type="radio" name="type" checked={filters.type === t.v} onChange={() => setFilter({ type: filters.type === t.v ? '' : t.v })} /> {t.l}
          </label>
        ))}
      </div>

      <div className="filter-group">
        <h4>Only</h4>
        <label className="check-row">
          <input type="checkbox" checked={filters.featured === 'true'} onChange={(e) => setFilter({ featured: e.target.checked ? 'true' : '' })} /> Featured / Hot Jobs
        </label>
      </div>
    </div>
  );
}
