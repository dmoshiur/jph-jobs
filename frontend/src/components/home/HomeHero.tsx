'use client';

import Link from 'next/link';
import { SearchBar } from '@/components/SearchBar';
import { useLang } from '@/hooks/useLang';
import type { Location, PublicStats } from '@/types/api';

function fmt(n: number) {
  return n.toLocaleString('en-US');
}

export function HomeHero({ stats, locations = [] }: { stats: PublicStats; locations?: Location[] }) {
  const { t } = useLang();
  const chips = locations.length
    ? locations.map((d) => ({ name: d.name, slug: d.slug, count: d._count?.districtJobs ?? 0 }))
    : [
      { name: 'Bogura', slug: 'bogura', count: 0 },
      { name: 'Joypurhat', slug: 'joypurhat', count: 0 }
    ];

  const tiles = [
    { href: '/jobs', label: t.liveJobs, value: fmt(stats.liveJobs) },
    { href: '/jobs', label: t.vacancies, value: `${fmt(stats.vacancies)}+` },
    { href: '/companies', label: t.companies, value: fmt(stats.companies) },
    { href: '/jobs?sort=newest', label: t.newJobs, value: fmt(stats.newJobs) }
  ];

  return (
    <section className="bdj-hero">
      <div className="container">
        <p className="bdj-hero-place">Bogura · Joypurhat</p>
        <h1>{t.findJob}</h1>
        <div className="bdj-stats">
          {tiles.map((s) => (
            <Link key={s.label} href={s.href} className="bdj-stat">
              <span className="lbl">{s.label}</span>
              <span className="num">{s.value}</span>
            </Link>
          ))}
        </div>
        <SearchBar locations={locations} />
        <div className="bdj-locs">
          {chips.map((c, i) => (
            <span key={c.slug}>
              <Link href={`/jobs?location=${c.slug}`}>{c.name}{c.count ? ` (${c.count})` : ''}</Link>
              {i < chips.length - 1 && <span className="sep" />}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
