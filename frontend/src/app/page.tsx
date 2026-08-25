import Link from 'next/link';
import { JobCard } from '@/components/JobCard';
import { CompanyCard } from '@/components/CompanyCard';
import { CategoryGrid } from '@/components/CategoryGrid';
import { QuickLinks } from '@/components/QuickLinks';
import { HomeHero } from '@/components/home/HomeHero';
import { fetchPublic } from '@/lib/server-data';
import type { Category, Company, Job, Location, PublicStats, QuickLinkCounts } from '@/types/api';

export const revalidate = 60;

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try { return await p; } catch { return fallback; }
}

export default async function HomePage() {
  const emptyStats = { liveJobs: 0, vacancies: 0, companies: 0, newJobs: 0 };
  const emptyLinks = { 
    latest: 0, 
    deadlineTomorrow: 0, 
    internship: 0, 
    partTime: 0, 
    remote: 0, 
    fresher: 0, 
    urgent: 0, 
    verifiedCompanies: 0 
  };
  
  const [stats, quickLinks, locations, categories, latest, companies, govtJobs, overseasJobs] = await Promise.all([
    safe(fetchPublic<PublicStats>('/public/stats'), emptyStats),
    safe(fetchPublic<QuickLinkCounts>('/public/quick-links'), emptyLinks),
    safe(fetchPublic<{ districts: Location[] }>('/public/locations?popular=true'), { districts: [] }),
    safe(fetchPublic<Category[]>('/public/categories'), []),
    safe(fetchPublic<{ items: Job[] }>('/jobs/x/latest?limit=10'), { items: [] }),
    safe(fetchPublic<{ items: Company[] }>('/companies/top?limit=8'), { items: [] }),
    safe(fetchPublic<{ items: Job[] }>('/jobs?type=govt&limit=10'), { items: [] }),
    safe(fetchPublic<{ items: Job[] }>('/jobs?location=-2&limit=10'), { items: [] }),
  ]);

  return (
    <>
      {/* Hero Section */}
      <HomeHero stats={stats} locations={locations.districts} />

      {/* Main Content Grid - Exact bdjobs.com layout */}
      <section className="container bdj-home">
        <div className="bdj-home-grid">
          {/* Main Content Area */}
          <div className="bdj-home-main">
            {/* Category Grid */}
            <CategoryGrid categories={categories} />

            {/* Latest Jobs Section */}
            <section className="bdj-latest-wrap">
              <div className="sec-head">
                <h2>Latest Jobs</h2>
                <Link href="/jobs">View All</Link>
              </div>
              {latest.items.length > 0 ? (
                <div className="bdj-latest-grid">
                  {latest.items.slice(0, 6).map((j) => (
                    <JobCard key={j.id} job={j} />
                  ))}
                </div>
              ) : (
                <p className="muted mb-0">No live jobs yet. Employers and shop owners can post the first opening.</p>
              )}
            </section>

            {/* Government Jobs Section */}
            {govtJobs.items.length > 0 && (
              <section className="bdj-govt">
                <div className="bdj-govt-h">
                  <h2>GOVT JOBS</h2>
                  <button className="bdj-pause" onClick={() => {}}>
                    <img src="/h/images/pause-green.svg" alt="Pause" />
                  </button>
                </div>
                <div className="bdj-ticker">
                  <div className="bdj-ticker-track">
                    {govtJobs.items.slice(0, 10).map((job) => (
                      <div key={job.id} className="bdj-ticker-item">
                        <strong>{job.company?.name || 'Government'}</strong>
                        <span>{job.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Link href="/jobs?type=govt" className="bdj-viewall">
                  VIEW All ({govtJobs.items.length})
                </Link>
              </section>
            )}

            {/* Overseas Jobs Section */}
            {overseasJobs.items.length > 0 && (
              <section className="bdj-over">
                <div className="bdj-over-h">
                  <span className="bdj-over-flag" aria-label="Bangladesh Flag" />
                  <h2>বিদেশে চাকরি</h2>
                </div>
                <ul className="bdj-jobrows">
                  {overseasJobs.items.slice(0, 5).map((job) => (
                    <li key={job.id}>
                      <Link href={`/jobs/${job.id}`}>
                        <span className="co">{job.company?.name}</span>
                        <span className="ti">{job.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href="/jobs?location=-2" className="bdj-viewall">
                  View All ({overseasJobs.items.length})
                </Link>
              </section>
            )}
          </div>

          {/* Sidebar Area */}
          <aside className="bdj-home-side">
            {/* Quick Links - Exact bdjobs.com */}
            <QuickLinks counts={{ 
              ...quickLinks, 
              companies: stats.companies 
            }} />
          </aside>
        </div>
      </section>

      {/* Featured Companies Section */}
      {companies.items.length > 0 && (
        <section className="container section">
          <div className="sec-head">
            <h2>Local employers</h2>
            <Link href="/companies">View All</Link>
          </div>
          <div className="grid grid-4">
            {companies.items.slice(0, 8).map((c) => (
              <CompanyCard key={c.id} company={c} />
            ))}
          </div>
        </section>
      )}

      {/* Note: Banners removed as per requirement - only logo is kept */}
    </>
  );
}
