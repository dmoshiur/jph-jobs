import Link from 'next/link';
import { SearchBar } from '@/components/SearchBar';
import { JobCard } from '@/components/JobCard';
import { CompanyCard } from '@/components/CompanyCard';
import { CategoryGrid } from '@/components/CategoryGrid';
import { QuickLinks } from '@/components/QuickLinks';
import { Skeleton } from '@/components/ui/Feedback';
import { fetchPublic } from '@/lib/server-data';
import { toBn } from '@/lib/format';
import { IconArrowRight, IconBuilding, IconFlame, IconPlus } from '@/components/ui/Icons';
import type { Category, Company, Job, Location, PublicStats, QuickLinkCounts } from '@/types/api';

// Revalidate homepage data every minute.
export const revalidate = 60;

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try { return await p; } catch { return fallback; }
}

export default async function HomePage() {
  const [stats, quickLinks, locations, categories, featured, hot, latest, companies] = await Promise.all([
    safe(fetchPublic<PublicStats>('/public/stats'), { liveJobs: 0, vacancies: 0, companies: 0, newJobs: 0 }),
    safe(fetchPublic<QuickLinkCounts>('/public/quick-links'), { latest: 0, deadlineTomorrow: 0, internship: 0, partTime: 0, remote: 0, fresher: 0, urgent: 0, verifiedCompanies: 0 }),
    safe(fetchPublic<{ districts: Location[] }>('/public/locations?popular=true'), { districts: [] }),
    safe(fetchPublic<Category[]>('/public/categories'), []),
    safe(fetchPublic<{ items: Job[] }>('/jobs/x/featured?limit=8'), { items: [] }),
    safe(fetchPublic<{ items: Job[] }>('/jobs/x/hot?limit=6'), { items: [] }),
    safe(fetchPublic<{ items: Job[] }>('/jobs/x/latest?limit=10'), { items: [] }),
    safe(fetchPublic<{ items: Company[] }>('/companies/top?limit=8'), { items: [] })
  ]);

  const popularUpazilas = (locations.districts ?? []).flatMap((d) => d.children ?? []).slice(0, 10);

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="container hero-inner">
          <div className="center" style={{ maxWidth: 860, margin: '0 auto' }}>
            <span className="loc-badge">📍 বগুড়া · জয়পুরহাট · বাংলাদেশ</span>
            <h1>বগুড়া ও জয়পুরহাট-এর আপনার পছন্দের চাকরি খুঁজুন</h1>
            <p className="subtitle">হাজারো স্থানীয় চাকরির সুযোগ এক জায়গায় — স্থানীয় কোম্পানি, দোকান ও প্রতিষ্ঠানের চাকরি</p>
            <SearchBar locations={locations.districts} />

            {popularUpazilas.length > 0 && (
              <div className="chips" style={{ justifyContent: 'center', marginTop: 18 }}>
                {locations.districts.map((d) => (
                  <Link key={d.id} href={`/jobs?location=${d.slug}`} className="chip" style={{ background: 'rgba(255,255,255,.15)', color: '#fff', borderColor: 'rgba(255,255,255,.3)' }}>
                    📍 {d.name}
                  </Link>
                ))}
                {popularUpazilas.slice(0, 6).map((u) => (
                  <Link key={u.id} href={`/jobs?location=${u.slug}`} className="chip">{u.name}</Link>
                ))}
              </div>
            )}

            <div className="stats-strip">
              <StatTile num={toBn(stats.liveJobs)} lbl="লাইভ চাকরি" />
              <StatTile num={toBn(stats.vacancies) + '+'} lbl="শূন্যপদ" />
              <StatTile num={toBn(stats.companies)} lbl="কোম্পানি" />
              <StatTile num={toBn(stats.newJobs)} lbl="নতুন চাকরি (২৪ ঘণ্টা)" />
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      {categories.length > 0 && (
        <section className="container section">
          <div className="sec-head">
            <div>
              <h2>জনপ্রিয় ক্যাটাগরি ও ইন্ডাস্ট্রি</h2>
              <p className="sub">আপনার দক্ষতা অনুযায়ী চাকরি খুঁজুন</p>
            </div>
            <Link href="/jobs">সব ক্যাটাগরি <IconArrowRight width={15} height={15} style={{ display: 'inline', verticalAlign: -2 }} /></Link>
          </div>
          <CategoryGrid categories={categories.slice(0, 12)} />
        </section>
      )}

      {/* MAIN GRID */}
      <section className="container section" style={{ paddingTop: 0 }}>
        <div className="layout-2col">
          <div className="main-col">
            {/* HOT / URGENT */}
            {hot.items.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div className="sec-head">
                  <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: 'var(--hot)' }}><IconFlame width={22} height={22} /></span> জরুরি নিয়োগ</h2>
                    <p className="sub">দ্রুত আবেদনের সীমিত সুযোগ</p>
                  </div>
                  <Link href="/jobs?hot=true">সব দেখুন</Link>
                </div>
                <div className="grid grid-2">
                  {hot.items.slice(0, 4).map((j) => <JobCard key={j.id} job={j} />)}
                </div>
              </div>
            )}

            {/* FEATURED */}
            {featured.items.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div className="sec-head">
                  <div>
                    <h2>⭐ ফিচার্ড চাকরি</h2>
                    <p className="sub">যাচাইকৃত নিয়োগদাতাদের সেরা পদ</p>
                  </div>
                  <Link href="/jobs?featured=true">সব দেখুন</Link>
                </div>
                <div className="grid grid-2">
                  {featured.items.slice(0, 4).map((j) => <JobCard key={j.id} job={j} />)}
                </div>
              </div>
            )}

            {/* LATEST */}
            <div>
              <div className="sec-head">
                <div>
                  <h2>সর্বশেষ চাকরি</h2>
                  <p className="sub">নতুন প্রকাশিত সকল পদ</p>
                </div>
                <Link href="/jobs">সব চাকরি দেখুন</Link>
              </div>
              <div className="grid grid-2">
                {latest.items.length > 0
                  ? latest.items.slice(0, 6).map((j) => <JobCard key={j.id} job={j} />)
                  : <FallbackSkeletons />}
              </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <aside className="sidebar" style={{ display: 'grid', gap: 18 }}>
            <QuickLinks counts={quickLinks} />

            {/* Employer CTA */}
            <div className="panel" style={{ background: 'linear-gradient(135deg, var(--primary-700), var(--secondary-600))', color: '#fff', border: 'none' }}>
              <div className="panel-b">
                <h3 style={{ color: '#fff' }}>নিয়োগদাতা? চাকরি পোস্ট করুন</h3>
                <p style={{ color: '#dbeafe' }}>বগুড়া ও জয়পুরহাটের লক্ষ লক্ষ প্রার্থীর কাছে পৌঁছান।</p>
                <Link href="/employers/post-job" className="btn btn-block" style={{ background: '#fff', color: 'var(--primary-700)' }}><IconPlus width={16} height={16} /> চাকরি পোস্ট করুন</Link>
              </div>
            </div>

            {/* Verified companies mini */}
            <div className="panel">
              <div className="panel-h"><h3><IconBuilding width={16} height={16} style={{ display: 'inline', verticalAlign: -3 }} /> ভেরিফাইড কোম্পানি</h3></div>
              <ul className="ql-list">
                {companies.items.slice(0, 6).map((c) => (
                  <li key={c.id}>
                    <Link href={`/companies/${c.slug || c.id}`}>
                      {c.name}
                      <span className="ql-cnt">{toBn(c._count?.jobs ?? 0)} টি পদ</span>
                    </Link>
                  </li>
                ))}
                {companies.items.length === 0 && <li style={{ padding: 12, color: 'var(--gray-400)', fontSize: '.85rem' }}>শীঘ্রই আরও কোম্পানি যুক্ত হচ্ছে</li>}
              </ul>
            </div>
          </aside>
        </div>
      </section>

      {/* COMPANIES */}
      {companies.items.length > 0 && (
        <section className="container section" style={{ background: '#fff', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div className="sec-head">
            <div>
              <h2>শীর্ষ নিয়োগদাতা প্রতিষ্ঠান</h2>
              <p className="sub">যারা এখন সক্রিয়ভাবে নিয়োগ দিচ্ছে</p>
            </div>
            <Link href="/companies">সব কোম্পানি</Link>
          </div>
          <div className="grid grid-4">
            {companies.items.slice(0, 8).map((c) => <CompanyCard key={c.id} company={c} />)}
          </div>
        </section>
      )}

      {/* CTA BAND */}
      <section className="container section center">
        <h2>আপনার ক্যারিয়ার এখান থেকে শুরু হোক</h2>
        <p>বগুড়া ও জয়পুরহাটের স্থানীয় চাকরির বাজারে সবচেয়ে বড় নেটওয়ার্ক।</p>
        <div className="state-actions" style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 10, flexWrap: 'wrap' }}>
          <Link href="/jobs" className="btn btn-lg">চাকরি খুঁজুন</Link>
          <Link href="/auth/register" className="btn btn-lg btn-secondary">অ্যাকাউন্ট খুলুন</Link>
        </div>
      </section>
    </>
  );
}

function StatTile({ num, lbl }: { num: string; lbl: string }) {
  return <div className="stat-tile"><div className="num">{num}</div><div className="lbl">{lbl}</div></div>;
}

function FallbackSkeletons() {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="job-card">
          <Skeleton style={{ height: 20, width: '70%', marginBottom: 10 }} />
          <Skeleton className="skel-line w60" />
          <Skeleton className="skel-line w40" />
        </div>
      ))}
    </>
  );
}
