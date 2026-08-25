'use client';

import Link from 'next/link';
import { SearchBar } from '@/components/SearchBar';
import { useLang } from '@/hooks/useLang';
import { formatCount } from '@/lib/format';
import type { Location, PublicStats } from '@/types/api';

export function HomeHero({ stats, locations = [] }: { stats: PublicStats; locations?: Location[] }) {
  const { lang, t } = useLang();

  const popularLocations = (locations.length
    ? locations.slice(0, 8)
    : [
        { name: 'Dhaka', slug: 'dhaka', _count: { districtJobs: 2807 } },
        { name: 'Chattogram', slug: 'chattogram', _count: { districtJobs: 334 } },
        { name: 'Khulna', slug: 'khulna', _count: { districtJobs: 120 } },
        { name: 'Rajshahi', slug: 'rajshahi', _count: { districtJobs: 115 } },
        { name: 'Sylhet', slug: 'sylhet', _count: { districtJobs: 93 } },
        { name: 'Rangpur', slug: 'rangpur', _count: { districtJobs: 81 } },
        { name: 'Mymensingh', slug: 'mymensingh', _count: { districtJobs: 75 } },
        { name: 'Barishal', slug: 'barishal', _count: { districtJobs: 42 } },
      ]
  ).map((l) => ({
    name: l.name,
    slug: l.slug,
    count: l._count?.districtJobs ?? 0,
  }));

  const tiles = [
    { href: '/jobs', label: t.liveJobs, value: formatCount(stats.liveJobs, lang) },
    { href: '/jobs', label: t.vacancies, value: `${formatCount(stats.vacancies, lang)}+` },
    { href: '/companies', label: t.companies, value: formatCount(stats.companies, lang) },
    { href: '/jobs?sort=newest', label: t.newJobs, value: formatCount(stats.newJobs, lang) },
  ];

  return (
    <section className="bdj-hero">
      <div className="container">
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
          {popularLocations.map((c, i) => (
            <span key={c.slug}>
              <Link href={`/jobs?location=${c.slug}`}>
                {c.name}{c.count ? ` (${formatCount(c.count, lang)})` : ''}
              </Link>
              {i < popularLocations.length - 1 && <span className="sep" />}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
