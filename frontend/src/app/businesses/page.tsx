'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState, ErrorState } from '@/components/ui/Feedback';
import { api, buildQuery } from '@/services/api';
import type { Business, Location, Paginated } from '@/types/api';
import { initials, toBn } from '@/lib/format';
import { IconLocation, IconPhone, IconCheck } from '@/components/ui/Icons';

const CATEGORIES = ['Electronics', 'Restaurant', 'Pharmacy', 'Hospital', 'Furniture', 'Automobile', 'Education', 'IT', 'Construction', 'Retail', 'Wholesale', 'Real Estate', 'Courier', 'Manufacturing', 'Others'];

export default function BusinessesPage() {
  const [items, setItems] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => { api.get<{ districts: Location[] }>('/public/locations').then((d) => setLocations(d.districts)).catch(() => undefined); }, []);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await api.get<Paginated<Business>>(`/businesses${buildQuery({ q, category, districtId, page, limit: 12 })}`);
      setItems(data.items); setPages(data.pages);
    } catch (e) { setError(e instanceof Error ? e.message : 'লোড ব্যর্থ'); }
    finally { setLoading(false); }
  }, [q, category, districtId, page]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="container" style={{ paddingTop: 18 }}>
      <nav className="crumb"><Link href="/">হোম</Link> <span>/</span> <span>ব্যবসা প্রতিষ্ঠান</span></nav>
      <h1 style={{ fontSize: '1.6rem' }}>স্থানীয় ব্যবসা প্রতিষ্ঠান</h1>
      <p className="muted">বগুড়া ও জয়পুরহাটের ইলেকট্রনিক্স, রেস্তোরাঁ, ফার্মেসি, হাসপাতালসহ স্থানীয় ব্যবসা প্রতিষ্ঠান।</p>

      <div className="panel card-pad" style={{ marginBottom: 20, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
        <input placeholder="ব্যবসা প্রতিষ্ঠান খুঁজুন" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} />
        <select value={category} onChange={(e) => { setPage(1); setCategory(e.target.value); }}>
          <option value="">সব ক্যাটাগরি</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={districtId} onChange={(e) => { setPage(1); setDistrictId(e.target.value); }}>
          <option value="">সব জেলা</option>
          {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>

      {loading ? <div className="grid grid-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="panel card-pad"><div className="skeleton" style={{ width: 56, height: 56, borderRadius: 14, margin: '0 auto 12px' }} /><div className="skeleton skel-line" /><div className="skeleton skel-line w60" /></div>)}</div>
        : error ? <ErrorState onRetry={load} />
        : items.length === 0 ? <EmptyState title="কোনো ব্যবসা প্রতিষ্ঠান পাওয়া যায়নি" action={{ label: 'ফিল্টার মুছুন', onClick: () => { setQ(''); setCategory(''); setDistrictId(''); } }} />
        : (
          <>
            <div className="grid grid-3">
              {items.map((b) => (
                <article key={b.id} className="panel card-pad">
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div className="job-logo" style={{ width: 48, height: 48 }}>{initials(b.name)}</div>
                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {b.name}
                        {b.isVerified && <span className="badge badge-verified" style={{ fontSize: '.62rem' }}><IconCheck width={10} height={10} /></span>}
                      </h3>
                      <span className="badge badge-gray" style={{ marginTop: 4 }}>{b.category}</span>
                    </div>
                  </div>
                  {b.description && <p className="text-sm mt-4" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{b.description}</p>}
                  <div className="text-sm muted" style={{ display: 'grid', gap: 4, marginTop: 10 }}>
                    {b.district && <span><IconLocation width={13} height={13} style={{ verticalAlign: -2 }} /> {[b.district?.name].filter(Boolean).join(', ')}</span>}
                    {b.phone && <span><IconPhone width={13} height={13} style={{ verticalAlign: -2 }} /> {b.phone}</span>}
                  </div>
                </article>
              ))}
            </div>
            <Pagination page={page} pages={pages} onPage={(p) => { setPage(p); window.scrollTo({ top: 0 }); }} />
          </>
        )}
    </div>
  );
}
