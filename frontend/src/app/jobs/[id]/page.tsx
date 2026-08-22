import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { API_URL } from '@/services/api';
import { ApplyButton } from './ApplyButton';
import { formatSalary, formatDate, initials, jobTypeLabel, toBn } from '@/lib/format';
import { IconLocation, IconMoney, IconClock, IconBriefcase, IconGraduation, IconBuilding, IconShare, IconBookmark, IconCheck, IconPhone, IconGlobe, IconMail } from '@/components/ui/Icons';

export const revalidate = 120;

async function getJob(id: string) {
  try {
    const res = await fetch(`${API_URL}/jobs/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) return { title: 'চাকরি পাওয়া যায়নি' };
  const location = [job.upazila?.name, job.district?.name].filter(Boolean).join(', ');
  return {
    title: `${job.title} — ${job.company?.name ?? ''}`,
    description: `${job.title} পদে ${job.company?.name ?? ''} নিয়োগ দিচ্ছে। লোকেশন: ${location || 'বগুড়া/জয়পুরহাট'}। বেতন: ${formatSalary(job)}।`,
    openGraph: { title: `${job.title} — ${job.company?.name ?? ''}`, description: `${location} · ${formatSalary(job)} · ${jobTypeLabel(job.type)}`, type: 'website' }
  };
}

function toParagraphs(text: string) {
  if (!text) return null;
  const blocks = text.split(/\n{2,}|(?=•|\d+\.)/).map((s) => s.trim()).filter(Boolean);
  return blocks.map((b, i) => <p key={i} style={{ color: 'var(--gray-700)', whiteSpace: 'pre-wrap' }}>{b}</p>);
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) notFound();

  const location = [job.upazila?.name, job.district?.name].filter(Boolean).join(', ') || 'বগুড়া/জয়পুরহাট';
  const company = job.company;
  const skills = (job.skills ?? []).map((s: any) => s.skill?.name).filter(Boolean);

  const structured = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.responsibilities + '\n\n' + job.requirements,
    datePosted: job.publishedAt ?? job.createdAt,
    validThrough: job.deadline,
    employmentType: job.type,
    hiringOrganization: { '@type': 'Organization', name: company?.name, ...(company?.website ? { sameAs: company.website } : {}) },
    jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: location, addressRegion: 'Rajshahi', addressCountry: 'BD' } },
    baseSalary: job.salaryMin ? { '@type': 'MonetaryAmount', currency: 'BDT', value: { '@type': 'QuantitativeValue', minValue: job.salaryMin, maxValue: job.salaryMax ?? job.salaryMin, unitText: 'MONTH' } } : undefined
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured) }} />

      {/* Header */}
      <div className="job-detail-h">
        <div className="container">
          <nav className="crumb" style={{ padding: '0 0 12px' }}>
            <Link href="/">হোম</Link> <span>/</span> <Link href="/jobs">চাকরি</Link> <span>/</span> <span>{job.title}</span>
          </nav>
          <div className="jd-top">
            <div className="job-logo" style={{ width: 68, height: 68, fontSize: '1.4rem' }}>{initials(company?.name ?? 'J')}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="flex gap-2 flex-wrap" style={{ marginBottom: 6 }}>
                {job.tier === 'HOT' && <span className="badge badge-hot">🔥 জরুরি</span>}
                {job.tier === 'FEATURED' && <span className="badge badge-featured">ফিচার্ড</span>}
                <span className="badge badge-blue">{jobTypeLabel(job.type)}</span>
                {company?.verificationStatus === 'VERIFIED' && <span className="badge badge-verified">ভেরিফাইড</span>}
              </div>
              <h1 style={{ fontSize: 'clamp(1.3rem,3vw,1.8rem)', margin: '0 0 4px' }}>{job.title}</h1>
              <div style={{ color: 'var(--gray-600)' }}>
                <Link href={`/companies/${company?.slug || company?.id}`} style={{ fontWeight: 600, color: 'var(--primary-700)' }}>{company?.name}</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="detail-grid">
          {/* MAIN */}
          <article className="panel detail-main" style={{ padding: 22 }}>
            <div className="detail-meta">
              <div className="dm"><div className="k"><IconLocation width={13} height={13} style={{ display: 'inline', verticalAlign: -2 }} /> লোকেশন</div><div className="v">{location}</div></div>
              <div className="dm"><div className="k"><IconMoney width={13} height={13} style={{ display: 'inline', verticalAlign: -2 }} /> বেতন</div><div className="v">{formatSalary(job)}</div></div>
              <div className="dm"><div className="k"><IconBriefcase width={13} height={13} style={{ display: 'inline', verticalAlign: -2 }} /> অভিজ্ঞতা</div><div className="v">{job.experience ?? 'উল্লেখ নেই'}</div></div>
              <div className="dm"><div className="k"><IconGraduation width={13} height={13} style={{ display: 'inline', verticalAlign: -2 }} /> শিক্ষা</div><div className="v">{job.education ?? 'উল্লেখ নেই'}</div></div>
              <div className="dm"><div className="k"><IconClock width={13} height={13} style={{ display: 'inline', verticalAlign: -2 }} /> আবেদনের শেষ সময়</div><div className="v">{formatDate(job.deadline)}</div></div>
              <div className="dm"><div className="k"><IconBriefcase width={13} height={13} style={{ display: 'inline', verticalAlign: -2 }} /> শূন্যপদ</div><div className="v">{toBn(job.vacancy)} টি</div></div>
            </div>

            {skills.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <h2>প্রয়োজনীয় দক্ষতা</h2>
                <div className="chips">{skills.map((s: string) => <span key={s} className="chip chip-blue">{s}</span>)}</div>
              </div>
            )}

            <h2>কাজের বিবরণ / দায়িত্ব</h2>
            {toParagraphs(job.responsibilities)}

            <h2>চাহিদা / যোগ্যতা</h2>
            {toParagraphs(job.requirements)}

            {job.benefits && (<><h2>সুবিধাদি</h2>{toParagraphs(job.benefits)}</>)}
          </article>

          {/* SIDEBAR */}
          <aside className="sticky-apply" style={{ display: 'grid', gap: 16 }}>
            <div className="panel" style={{ padding: 18 }}>
              <ApplyButton jobId={job.id} deadline={job.deadline} />
              <div className="grid grid-2" style={{ gap: 8, marginTop: 10 }}>
                <button className="btn btn-secondary btn-sm" aria-label="সংরক্ষণ করুন"><IconBookmark width={15} height={15} /> সংরক্ষণ</button>
                <button className="btn btn-secondary btn-sm" aria-label="শেয়ার করুন" onClick={() => { if (navigator.share) navigator.share({ title: job.title, url: window.location.href }).catch(() => {}); }}><IconShare width={15} height={15} /> শেয়ার</button>
              </div>
              {job.views > 0 && <p className="text-sm muted center mt-4 mb-0">👁 {toBn(job.views)} বার দেখা হয়েছে</p>}
            </div>

            {company && (
              <div className="panel" style={{ padding: 18 }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><IconBuilding width={18} height={18} /> কোম্পানি তথ্য</h3>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '12px 0' }}>
                  <div className="job-logo" style={{ width: 48, height: 48 }}>{initials(company.name)}</div>
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      {company.name}
                      {company.verificationStatus === 'VERIFIED' && <span className="badge badge-verified" style={{ marginLeft: 6, fontSize: '.64rem' }}>ভেরিফাইড</span>}
                    </div>
                    {company.category && <div className="text-sm muted">{company.category}</div>}
                  </div>
                </div>
                {company.about && <p className="text-sm" style={{ marginBottom: 12 }}>{company.about.slice(0, 180)}{company.about.length > 180 ? '…' : ''}</p>}
                {company.address && <div className="text-sm" style={{ display: 'flex', gap: 8, marginBottom: 6 }}><IconLocation width={14} height={14} /> {company.address}</div>}
                {company.phone && <div className="text-sm" style={{ display: 'flex', gap: 8, marginBottom: 6 }}><IconPhone width={14} height={14} /> {company.phone}</div>}
                {company.email && <div className="text-sm" style={{ display: 'flex', gap: 8, marginBottom: 6 }}><IconMail width={14} height={14} /> {company.email}</div>}
                {company.website && <div className="text-sm" style={{ display: 'flex', gap: 8, marginBottom: 6 }}><IconGlobe width={14} height={14} /> <a href={company.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-600)' }}>ওয়েবসাইট</a></div>}
                <Link href={`/companies/${company.slug || company.id}`} className="btn btn-outline btn-sm btn-block mt-4">এই কোম্পানির চাকরি দেখুন <IconCheck width={14} height={14} /></Link>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Mobile sticky apply */}
      <div className="mobile-apply-bar">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '.9rem' }} className="ellipsis">{job.title}</div>
          <div className="text-sm muted ellipsis">{company?.name}</div>
        </div>
        <ApplyButton jobId={job.id} deadline={job.deadline} compact />
      </div>
    </>
  );
}
