'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { IconSearch, IconLocation } from '@/components/ui/Icons';
import type { Location } from '@/types/api';

interface Suggestion { jobs: { id: string; title: string; slug: string; company?: { name: string } }[]; companies: { id: string; name: string }[]; categories: { name: string; slug: string }[] }

export function SearchBar({ locations = [] }: { locations?: Location[] }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [loc, setLoc] = useState('');
  const [suggest, setSuggest] = useState<Suggestion | null>(null);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) { setSuggest(null); return; }
    const t = setTimeout(() => {
      api.get<Suggestion>(`/public/search/suggest?q=${encodeURIComponent(q)}`).then(setSuggest).catch(() => undefined);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (loc) params.set('location', loc);
    router.push(`/jobs${params.toString() ? `?${params}` : ''}`);
    setOpen(false);
  }

  function pick() { setOpen(false); }

  return (
    <form className="search-box" onSubmit={submit} role="search">
      <div className="suggest" ref={boxRef}>
        <label className="input-wrap">
          <span className="ic"><IconSearch width={18} height={18} /></span>
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="পদের নাম, দক্ষতা বা কোম্পানি লিখুন"
            aria-label="চাকরি খুঁজুন"
          />
        </label>
        {open && suggest && (suggest.jobs.length || suggest.companies.length || suggest.categories.length) > 0 && (
          <div className="suggest-list">
            {suggest.jobs.length > 0 && (
              <div className="suggest-group">
                <h4>চাকরি</h4>
                {suggest.jobs.map((j) => (
                  <Link key={j.id} href={`/jobs/${j.slug || j.id}`} className="suggest-item" onClick={pick}>
                    {j.title} <small>· {j.company?.name}</small>
                  </Link>
                ))}
              </div>
            )}
            {suggest.categories.length > 0 && (
              <div className="suggest-group">
                <h4>ক্যাটাগরি</h4>
                {suggest.categories.map((c) => (
                  <Link key={c.slug} href={`/jobs?category=${c.slug}`} className="suggest-item" onClick={pick}>{c.name}</Link>
                ))}
              </div>
            )}
            {suggest.companies.length > 0 && (
              <div className="suggest-group">
                <h4>কোম্পানি</h4>
                {suggest.companies.map((c) => (
                  <Link key={c.id} href={`/companies/${c.id}`} className="suggest-item" onClick={pick}>{c.name}</Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <label className="input-wrap">
        <span className="ic"><IconLocation width={18} height={18} /></span>
        <select value={loc} onChange={(e) => setLoc(e.target.value)} aria-label="লোকেশন">
          <option value="">সব লোকেশন</option>
          {locations.map((l) => (
            <optgroup key={l.id} label={l.name}>
              <option value={l.slug}>{l.name} (সব)</option>
              {l.children?.map((c) => <option key={c.id} value={c.slug}>{c.name}, {l.name}</option>)}
            </optgroup>
          ))}
        </select>
      </label>

      <button type="submit" className="btn btn-lg"><IconSearch width={18} height={18} /> চাকরি খুঁজুন</button>
    </form>
  );
}
