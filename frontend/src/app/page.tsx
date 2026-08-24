import Link from 'next/link';
import { JobCard } from '@/components/JobCard';
import { CompanyCard } from '@/components/CompanyCard';
import { CategoryGrid } from '@/components/CategoryGrid';
import { QuickLinks } from '@/components/QuickLinks';
import { fetchPublic } from '@/lib/server-data';
import { HomeHero } from '@/components/home/HomeHero';
import type { Category, Company, Job, Location, PublicStats, QuickLinkCounts } from '@/types/api';

export const revalidate = 60;

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try { return await p; } catch { return fallback; }
}

export default async function HomePage() {
  const emptyStats = { liveJobs: 0, vacancies: 0, companies: 0, newJobs: 0 };
  const emptyLinks = { latest: 0, deadlineTomorrow: 0, internship: 0, partTime: 0, remote: 0, fresher: 0, urgent: 0, verifiedCompanies: 0 };
  const [stats, quickLinks, locations, categories, latest, companies] = await Promise.all([
    safe(fetchPublic<PublicStats>('/public/stats'), emptyStats),
    safe(fetchPublic<QuickLinkCounts>('/public/quick-links'), emptyLinks),
    safe(fetchPublic<{ districts: Location[] }>('/public/locations?popular=true'), { districts: [] }),
    safe(fetchPublic<Category[]>('/public/categories'), []),
    safe(fetchPublic<{ items: Job[] }>('/jobs/x/latest?limit=10'), { items: [] }),
    safe(fetchPublic<{ items: Company[] }>('/companies/top?limit=8'), { items: [] })
  ]);

  return (
    <>
      <HomeHero stats={stats} locations={locations.districts} />

      <section className="container bdj-home">
        <div className="bdj-home-grid">
          <div className="bdj-home-main">
            <CategoryGrid categories={categories} />

            <section className="bdj-latest-wrap">
              <div className="sec-head">
                <h2>Latest Jobs in Bogura &amp; Joypurhat</h2>
                <Link href="/jobs">View All</Link>
              </div>
              {latest.items.length > 0 ? (
                <div className="bdj-latest-grid">
                  {latest.items.slice(0, 6).map((j) => <JobCard key={j.id} job={j} />)}
                </div>
              ) : (
                <p className="muted mb-0">No live jobs yet. Employers and shop owners in Bogura and Joypurhat can post the first opening.</p>
              )}
            </section>
          </div>

          <aside className="bdj-home-side">
            <QuickLinks counts={{ ...quickLinks, companies: stats.companies }} />
          </aside>
        </div>
      </section>

      {companies.items.length > 0 && (
        <section className="container section">
          <div className="sec-head">
            <h2>Local employers</h2>
            <Link href="/companies">View All</Link>
          </div>
          <div className="grid grid-4">
            {companies.items.slice(0, 8).map((c) => <CompanyCard key={c.id} company={c} />)}
          </div>
        </section>
      )}
    </>
  );
}
