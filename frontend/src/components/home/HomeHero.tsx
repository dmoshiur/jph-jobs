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
  
  // Get popular locations with job counts
  const popularLocations = locations.length
    ? locations.slice(0, 8)
    : [
        { name: 'Dhaka', slug: 'dhaka', count: 0 },
        { name: 'Chattogram', slug: 'chattogram', count: 0 },
        { name: 'Sylhet', slug: 'sylhet', count: 0 },
        { name: 'Rajshahi', slug: 'rajshahi', count: 0 },
        { name: 'Khulna', slug: 'khulna', count: 0 },
        { name: 'Barishal', slug: 'barishal', count: 0 },
        { name: 'Rangpur', slug: 'rangpur', count: 0 },
        { name: 'Mymensingh', slug: 'mymensingh', count: 0 },
      ];

  // Stats tiles matching bdjobs.com
  const tiles = [
    { 
      href: '/jobs', 
      label: t.liveJobs || 'LIVE JOBS', 
      value: fmt(stats.liveJobs) 
    },
    { 
      href: '/jobs', 
      label: t.vacancies || 'VACANCIES', 
      value: `${fmt(stats.vacancies)}+` 
    },
    { 
      href: '/companies', 
      label: t.companies || 'COMPANIES', 
      value: fmt(stats.companies) 
    },
    { 
      href: '/jobs?sort=newest', 
      label: t.newJobs || 'NEW JOBS', 
      value: fmt(stats.newJobs) 
    },
  ];

  return (
    <>
      {/* Hero Section - Exact bdjobs.com structure */}
      <section className="bdj-hero">
        <div className="container">
          {/* Find The Right Job */}
          <h1>{t.findJob || 'Find The Right Job'}</h1>
          
          {/* Stats Bar */}
          <div className="bdj-stats">
            {tiles.map((s) => (
              <Link key={s.label} href={s.href} className="bdj-stat">
                <span className="lbl">{s.label}</span>
                <span className="num">{s.value}</span>
              </Link>
            ))}
          </div>

          {/* Search Bar */}
          <SearchBar locations={locations} />

          {/* Location Chips - Exact bdjobs.com */}
          <div className="bdj-locs">
            {popularLocations.map((c, i) => (
              <span key={c.slug}>
                <Link href={`/jobs?location=${c.slug}`}>
                  {c.name}{c.count ? ` (${c.count})` : ''}
                </Link>
                {i < popularLocations.length - 1 && <span className="sep" />}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Discover Jobs Section - Exact bdjobs.com */}
      <section className="container section-tight">
        <div className="bdj-discover">
          <h2>{t.discoverJobs || 'Discover Jobs Across Popular Category & Industry'}</h2>
        </div>
      </section>
    </>
  );
}
