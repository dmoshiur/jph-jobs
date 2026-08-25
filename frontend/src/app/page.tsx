import Link from 'next/link';
import { QuickLinks } from '@/components/QuickLinks';
import { HomeHero } from '@/components/home/HomeHero';
import { DiscoverSection } from '@/components/home/DiscoverSection';
import { GovtTicker } from '@/components/home/GovtTicker';
import { OverseasJobs } from '@/components/home/OverseasJobs';
import { HotJobs } from '@/components/home/HotJobs';
import { fetchPublic } from '@/lib/server-data';
import {
  DEMO_CATEGORIES, DEMO_COMPANIES, DEMO_GOVT_JOBS, DEMO_INDUSTRIES,
  DEMO_JOBS, DEMO_LOCATIONS, DEMO_OVERSEAS, DEMO_QUICK_LINKS, DEMO_STATS,
} from '@/lib/demo-data';
import type { Category, Company, Job, Location, PublicStats, QuickLinkCounts } from '@/types/api';

export const revalidate = 60;

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try { return await p; } catch { return fallback; }
}

export default async function HomePage() {
  const [liveStats, liveLinks, liveLocs, liveCats, liveLatest, liveCos] = await Promise.all([
    safe(fetchPublic<PublicStats>('/public/stats'), DEMO_STATS),
    safe(fetchPublic<QuickLinkCounts>('/public/quick-links'), DEMO_QUICK_LINKS),
    safe(fetchPublic<{ districts: Location[] }>('/public/locations?popular=true'), { districts: DEMO_LOCATIONS }),
    safe(fetchPublic<Category[]>('/public/categories'), DEMO_CATEGORIES),
    safe(fetchPublic<{ items: Job[] }>('/jobs/x/latest?limit=12'), { items: DEMO_JOBS }),
    safe(fetchPublic<{ items: Company[] }>('/companies/top?limit=8'), { items: DEMO_COMPANIES }),
  ]);

  const stats = liveStats.liveJobs > 0 ? liveStats : DEMO_STATS;
  const quickLinks = liveLinks.latest > 0 ? { ...DEMO_QUICK_LINKS, ...liveLinks } : DEMO_QUICK_LINKS;
  const locations = liveLocs.districts?.length ? liveLocs.districts : DEMO_LOCATIONS;
  const categories = liveCats.length ? liveCats : DEMO_CATEGORIES;
  const latest = liveLatest.items?.length ? liveLatest.items : DEMO_JOBS;
  const companies = liveCos.items?.length ? liveCos.items : DEMO_COMPANIES;
  const govtJobs = DEMO_GOVT_JOBS;
  const overseasJobs = DEMO_OVERSEAS;
  const hotJobs = [...DEMO_JOBS.filter((j) => j.tier === 'HOT' || j.tier === 'FEATURED'), ...DEMO_JOBS].slice(0, 16);

  return (
    <>
      <HomeHero stats={stats} locations={locations} />

      <section className="container bdj-home">
        <div className="bdj-home-grid">
          <div className="bdj-home-main">
            <DiscoverSection categories={categories} industries={DEMO_INDUSTRIES} />

            <section className="bdj-latest-wrap">
              <div className="sec-head">
                <h2>Latest Jobs</h2>
                <Link href="/jobs">View All</Link>
              </div>
              <div className="bdj-latest-grid">
                {latest.slice(0, 10).map((j) => (
                  <Link key={j.id} href={`/jobs/${j.slug || j.id}`} className="bdj-jobrow">
                    <span className="co">{j.company?.name}</span>
                    <span className="ti">{j.title}</span>
                  </Link>
                ))}
              </div>
            </section>

            <GovtTicker jobs={govtJobs} />
            <OverseasJobs jobs={overseasJobs} />
          </div>

          <aside className="bdj-home-side">
            <QuickLinks counts={{ ...quickLinks, companies: stats.companies }} />
          </aside>
        </div>
      </section>

      <HotJobs jobs={hotJobs} />

      {companies.length > 0 && (
        <section className="container section" style={{ paddingTop: 0 }}>
          <div className="sec-head">
            <div>
              <h2>Employer List</h2>
              <p className="sub">Trusted companies hiring across Bangladesh</p>
            </div>
            <Link href="/companies">View All</Link>
          </div>
          <div className="grid grid-4">
            {companies.slice(0, 8).map((c) => (
              <Link key={c.id} href={`/companies/${c.slug || c.id}`} className="bdj-emp-card">
                <div className="bdj-emp-logo" style={{ background: avatar(c.name) }}>{letters(c.name)}</div>
                <h3>{c.name}</h3>
                <div className="meta">{c.category || 'Private Firm/Company'}</div>
                <div className="meta" style={{ color: 'var(--bdj-blue)', fontWeight: 700, marginTop: 4 }}>
                  {c._count?.jobs ?? 0} live jobs
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function letters(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
}
function avatar(name: string) {
  const palette = ['#0072bc', '#0aa2c0', '#1aaa55', '#c0392b', '#8e44ad', '#d35400', '#16a085', '#2c3e50'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}
