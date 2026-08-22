'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CompanyCard } from '@/components/CompanyCard';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingRows, EmptyState, ErrorState } from '@/components/ui/Feedback';
import { api, buildQuery } from '@/services/api';
import type { Company, Location, Paginated } from '@/types/api';

export default function CompaniesPage() {
  const [items, setItems] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [hiring, setHiring] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    api.get<{ districts: Location[] }>('/public/locations').then((d) => setLocations(d.districts)).catch(() => undefined);
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const query = buildQuery({ q, districtId, hiring: hiring ? 'true' : '', page, limit: 12, verified: 'true' });
      const data = await api.get<Paginated<Company>>(`/companies${query}`);
      setItems(data.items); setTotal(data.total); setPages(data.pages);
    } catch (e) { setError(e instanceof Error ? e.message : 'লোড ব্যর্থ'); }
    finally { setLoading(false); }
  }, [q, districtId, hiring, page]);

  useEffect(() => { void load(); }, [load]);

  const heading = useMemo(() => (q ? `“${q}” কোম্পানি` : 'কোম্পানি তালিকা'), [q]);

  return (
    <div className="container" style={{ paddingTop: 18 }}>
      <nav className="crumb"><Link href="/">হোম</Link> <span>/</span> <span>কোম্পানি</span></nav>
      <h1 style={{ fontSize: '1.6rem' }}>কোম্পানি তালিকা</h1>
      <p className="muted">বগুড়া ও জয়পুরহাটের যাচাইকৃত নিয়োগদাতা প্রতিষ্ঠান।</p>

      <div className="panel card-pad" style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 10, alignItems: 'center' }}>
          <input placeholder="কোম্পানির নাম খুঁজুন" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} />
          <select value={districtId} onChange={(e) => { setPage(1); setDistrictId(e.target.value); }}>
            <option value="">সব জেলা</option>
            {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <label className="check-row" style={{ margin: 0, whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={hiring} onChange={(e) => { setPage(1); setHiring(e.target.checked); }} /> এখন নিয়োগ চলছে
          </label>
        </div>
      </div>

      <h2 style={{ fontSize: '1.1rem', marginBottom: 14 }}>{heading} <span className="muted text-sm">({total})</span></h2>

      {loading ? <div className="grid grid-4"><LoaderCards /></div>
        : error ? <ErrorState onRetry={load} />
        : items.length === 0 ? <EmptyState title="কোনো কোম্পানি পাওয়া যায়নি" action={{ label: 'ফিল্টার মুছুন', onClick: () => { setQ(''); setDistrictId(''); setHiring(false); } }} />
        : (<>
          <div className="grid grid-4">{items.map((c) => <CompanyCard key={c.id} company={c} />)}</div>
          <Pagination page={page} pages={pages} onPage={(p) => { setPage(p); window.scrollTo({ top: 0 }); }} />
        </>)}
    </div>
  );
}

function LoaderCards() {
  return <>{Array.from({ length: 8 }).map((_, i) => <div key={i} className="company-card"><div className="skeleton" style={{ width: 60, height: 60, borderRadius: 14, margin: '0 auto 12px' }} /><div className="skeleton skel-line" /><div className="skeleton skel-line w60" /></div>)}</>;
}
