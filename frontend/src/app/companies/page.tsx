'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingRows, EmptyState, ErrorState } from '@/components/ui/Feedback';
import { api, buildQuery } from '@/services/api';
import { DEMO_COMPANIES, DEMO_LOCATIONS } from '@/lib/demo-data';
import { initials, logoColor } from '@/lib/format';
import type { Company, Location, Paginated } from '@/types/api';

export default function CompaniesPage() {
  const [items, setItems] = useState<Company[]>(DEMO_COMPANIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(DEMO_COMPANIES.length);
  const [q, setQ] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [hiring, setHiring] = useState(false);
  const [locations, setLocations] = useState<Location[]>(DEMO_LOCATIONS);

  useEffect(() => {
    api.get<{ districts: Location[] }>('/public/locations')
      .then((d) => { if (d.districts?.length) setLocations(d.districts); })
      .catch(() => undefined);
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const query = buildQuery({ q, districtId, hiring: hiring ? 'true' : '', page, limit: 12, verified: 'true' });
      const data = await api.get<Paginated<Company>>(`/companies${query}`);
      if (data.items?.length) {
        setItems(data.items); setTotal(data.total); setPages(data.pages);
        return;
      }
      throw new Error('empty');
    } catch {
      const filtered = DEMO_COMPANIES.filter((c) =>
        !q || c.name.toLowerCase().includes(q.toLowerCase()) || (c.category || '').toLowerCase().includes(q.toLowerCase()),
      );
      setItems(filtered);
      setTotal(filtered.length);
      setPages(1);
      setError('');
    } finally {
      setLoading(false);
    }
  }, [q, districtId, hiring, page]);

  useEffect(() => { void load(); }, [load]);

  const heading = useMemo(() => (q ? `“${q}”` : 'Employer List'), [q]);

  return (
    <div className="container bdj-jobs-page">
      <nav className="crumb"><Link href="/">Home</Link> <span>/</span> <span>Employer List</span></nav>
      <div className="bdj-countbar">
        <h1>{heading} <span className="vac">({total})</span></h1>
      </div>

      <div className="panel card-pad" style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 10, alignItems: 'center' }}>
          <input placeholder="Search employer" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} />
          <select value={districtId} onChange={(e) => { setPage(1); setDistrictId(e.target.value); }}>
            <option value="">All locations</option>
            {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <label className="check-row" style={{ margin: 0, whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={hiring} onChange={(e) => { setPage(1); setHiring(e.target.checked); }} /> Currently hiring
          </label>
        </div>
      </div>

      {loading ? <LoadingRows />
        : error ? <ErrorState onRetry={load} />
        : items.length === 0 ? <EmptyState title="No employers found" action={{ label: 'Clear', onClick: () => { setQ(''); setDistrictId(''); setHiring(false); } }} />
        : (
          <>
            <div className="grid grid-4">
              {items.map((c) => (
                <Link key={c.id} href={`/companies/${c.slug || c.id}`} className="bdj-emp-card">
                  <div className="bdj-emp-logo" style={{ background: logoColor(c.name) }}>{initials(c.name)}</div>
                  <h3>{c.name}</h3>
                  <div className="meta">{c.category}</div>
                  <div className="meta">{c.district?.name ?? 'Bangladesh'}</div>
                  <div className="meta" style={{ color: 'var(--bdj-blue)', fontWeight: 700, marginTop: 6 }}>
                    {c._count?.jobs ?? 0} live jobs
                  </div>
                </Link>
              ))}
            </div>
            <Pagination page={page} pages={pages} onPage={(p) => { setPage(p); window.scrollTo({ top: 0 }); }} />
          </>
        )}
    </div>
  );
}
