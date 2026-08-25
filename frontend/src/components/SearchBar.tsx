'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { IconSearch } from '@/components/ui/Icons';
import { useLang } from '@/hooks/useLang';
import type { Location } from '@/types/api';

interface Suggestion { jobs: { id: string; title: string; slug: string; company?: { name: string } }[]; companies: { id: string; name: string }[]; categories: { name: string; slug: string }[] }

export function SearchBar({ locations = [], variant = 'hero' }: { locations?: Location[]; variant?: 'hero' | 'compact' }) {
  const router = useRouter();
  const { t } = useLang();
  const [q, setQ] = useState('');
  const [suggest, setSuggest] = useState<Suggestion | null>(null);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  void locations;

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) { setSuggest(null); return; }
    const timer = setTimeout(() => {
      api.get<Suggestion>(`/public/search/suggest?q=${encodeURIComponent(q)}`).then(setSuggest).catch(() => undefined);
    }, 250);
    return () => clearTimeout(timer);
  }, [q]);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    router.push(`/jobs${params.toString() ? `?${params}` : ''}`);
    setOpen(false);
  }

  return (
    <form className={`bdj-search ${variant}`} onSubmit={submit} role="search">
      <div className="bdj-search-field suggest" ref={boxRef}>
        <span className="bdj-search-ic"><IconSearch width={18} height={18} /></span>
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={t.searchPh || 'Job title, skill or company'}
          aria-label={t.search}
        />
        {open && suggest && (suggest.jobs.length || suggest.companies.length || suggest.categories.length) > 0 && (
          <div className="suggest-list">
            {suggest.jobs.length > 0 && (
              <div className="suggest-group">
                <h4>{t.jobs}</h4>
                {suggest.jobs.map((j) => (
                  <Link key={j.id} href={`/jobs/${j.slug || j.id}`} className="suggest-item" onClick={() => setOpen(false)}>
                    {j.title} <small>· {j.company?.name}</small>
                  </Link>
                ))}
              </div>
            )}
            {suggest.categories.length > 0 && (
              <div className="suggest-group">
                <h4>{t.category}</h4>
                {suggest.categories.map((c) => (
                  <Link key={c.slug} href={`/jobs?category=${c.slug}`} className="suggest-item" onClick={() => setOpen(false)}>{c.name}</Link>
                ))}
              </div>
            )}
            {suggest.companies.length > 0 && (
              <div className="suggest-group">
                <h4>{t.companiesNav}</h4>
                {suggest.companies.map((c) => (
                  <Link key={c.id} href={`/companies/${c.id}`} className="suggest-item" onClick={() => setOpen(false)}>{c.name}</Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <button type="submit" className="bdj-search-btn">{t.search}</button>
    </form>
  );
}
