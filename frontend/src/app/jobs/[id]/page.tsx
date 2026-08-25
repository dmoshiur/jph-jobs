import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { API_URL } from '@/services/api';
import { ApplyButton } from './ApplyButton';
import { formatSalary, formatDate, initials, jobTypeLabel, logoColor } from '@/lib/format';
import { IconLocation, IconShare, IconBookmark, IconBuilding } from '@/components/ui/Icons';
import { findDemoJob } from '@/lib/demo-data';
import type { Job } from '@/types/api';

export const revalidate = 120;

async function getJob(id: string): Promise<Job | null> {
  try {
    const res = await fetch(`${API_URL}/jobs/${id}`, { next: { revalidate: 60 } });
    if (res.ok) {
      const json = await res.json();
      if (json.data) return json.data as Job;
    }
  } catch { /* demo fallback */ }
  return findDemoJob(id) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) return { title: 'Job not found' };
  return {
    title: `${job.title} — ${job.company?.name ?? 'jobhub.com'}`,
    description: `${job.title} at ${job.company?.name ?? ''}. Apply online on jobhub.com.`,
  };
}

function lines(text?: string | null) {
  if (!text) return null;
  return text.split('\n').map((b) => b.trim()).filter(Boolean);
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) notFound();

  const location = [job.upazila?.name, job.district?.name].filter(Boolean).join(', ') || 'Bangladesh';
  const company = job.company;
  const skills = (job.skills ?? []).map((s) => s.skill?.name).filter(Boolean);
  const color = logoColor(company?.name ?? 'J');

  const structured = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: `${job.responsibilities}\n\n${job.requirements}`,
    datePosted: job.publishedAt ?? job.createdAt,
    validThrough: job.deadline,
    employmentType: job.type,
    hiringOrganization: { '@type': 'Organization', name: company?.name },
    jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: location, addressCountry: 'BD' } },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured) }} />

      <div className="bdj-circ-top">
        <div className="container">
          <nav className="crumb">
            <Link href="/">Home</Link> <span>/</span> <Link href="/jobs">Jobs</Link> <span>/</span> <span>{job.title}</span>
          </nav>
          <div className="bdj-circ-head">
            <div className="bdj-circ-logo" style={{ background: color }}>{initials(company?.name ?? 'J')}</div>
            <div>
              <h1>{job.title}</h1>
              <div style={{ color: '#555' }}>
                <Link href={`/companies/${company?.slug || company?.id}`} style={{ fontWeight: 700, color: 'var(--bdj-blue)' }}>
                  {company?.name}
                </Link>
              </div>
              <div className="bdj-circ-tools">
                <span className="bdj-tool"><IconBookmark width={14} height={14} /> Save</span>
                <span className="bdj-tool"><IconShare width={14} height={14} /> Send to Friend</span>
                <span className="bdj-tool">Print</span>
                <span className="bdj-tool">Report</span>
              </div>
            </div>
            <div className="bdj-circ-actions">
              <ApplyButton jobId={job.id} deadline={job.deadline} />
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="bdj-circ-grid">
          <article className="bdj-circ-main">
            <h2>Job Summary</h2>
            <div className="bdj-sum">
              <div className="k">Published on</div>
              <div className="v">{formatDate(job.publishedAt || job.createdAt, 'en')}</div>
              <div className="k">Vacancy</div>
              <div className="v">{job.vacancy}</div>
              <div className="k">Employment Status</div>
              <div className="v">{jobTypeLabel(job.type, 'en')}</div>
              <div className="k">Experience</div>
              <div className="v">{job.experience ?? 'N/A'}</div>
              <div className="k">Job Location</div>
              <div className="v">{location}</div>
              <div className="k">Salary</div>
              <div className="v">{formatSalary(job, 'en')}</div>
              <div className="k">Application Deadline</div>
              <div className="v">{formatDate(job.deadline, 'en')}</div>
            </div>

            <h2>Responsibilities & Context</h2>
            <ul>
              {(lines(job.responsibilities) ?? ['Perform assigned duties as per management instruction.']).map((b) => (
                <li key={b}>{b.replace(/^•\s*/, '')}</li>
              ))}
            </ul>

            <h2>Educational Requirements</h2>
            <p>{job.education ?? 'Bachelor degree in any discipline'}</p>

            <h2>Experience Requirements</h2>
            <p>{job.experience ?? 'N/A'}</p>

            <h2>Additional Requirements</h2>
            <ul>
              {(lines(job.requirements) ?? []).map((b) => <li key={b}>{b.replace(/^•\s*/, '')}</li>)}
            </ul>

            {skills.length > 0 && (
              <>
                <h2>Skills & Expertise</h2>
                <div className="chips">{skills.map((s) => <span key={s} className="chip chip-blue">{s}</span>)}</div>
              </>
            )}

            <h2>Workplace</h2>
            <p>{job.type === 'REMOTE' ? 'Work from home' : 'Work at office'}</p>

            <h2>Job Location</h2>
            <p><IconLocation width={14} height={14} style={{ verticalAlign: -2 }} /> {location}</p>

            <h2>Compensation & Other Benefits</h2>
            <p>{job.benefits || 'As per company policy.'}</p>

            <div style={{ marginTop: 22, maxWidth: 240 }}>
              <ApplyButton jobId={job.id} deadline={job.deadline} />
            </div>
          </article>

          <aside className="sticky-apply" style={{ display: 'grid', gap: 14 }}>
            <div className="bdj-co-box">
              <ApplyButton jobId={job.id} deadline={job.deadline} />
            </div>
            {company && (
              <div className="bdj-co-box">
                <h3><IconBuilding width={16} height={16} style={{ verticalAlign: -3 }} /> Company Information</h3>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                  <div className="bdj-list-logo" style={{ background: color }}>{initials(company.name)}</div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{company.name}</div>
                    {company.category && <div className="text-sm muted">{company.category}</div>}
                  </div>
                </div>
                {company.about && <p className="text-sm">{company.about}</p>}
                {company.address && <p className="text-sm muted mb-0">{company.address}</p>}
                <Link href={`/companies/${company.slug || company.id}`} className="btn btn-outline btn-sm btn-block mt-4">
                  View all jobs of this company
                </Link>
              </div>
            )}
          </aside>
        </div>
      </div>

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
