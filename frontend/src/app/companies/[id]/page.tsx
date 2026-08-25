import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { API_URL } from '@/services/api';
import { JobListCard } from '@/components/jobs/JobListCard';
import { initials, logoColor } from '@/lib/format';
import { IconLocation, IconBuilding } from '@/components/ui/Icons';
import { findDemoCompany } from '@/lib/demo-data';
import type { Company, Job } from '@/types/api';

export const revalidate = 300;

async function getCompany(id: string): Promise<Company | null> {
  try {
    const res = await fetch(`${API_URL}/companies/${id}`, { next: { revalidate: 120 } });
    if (res.ok) {
      const data = (await res.json()).data;
      if (data) return data as Company;
    }
  } catch { /* demo */ }
  return findDemoCompany(id) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) return { title: 'Company not found' };
  return { title: `${company.name} — Jobs & profile`, description: company.about ?? `${company.name} jobs on jobhub.com` };
}

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) notFound();
  const activeJobs: Job[] = company.jobs ?? [];
  const color = logoColor(company.name);

  return (
    <div className="container bdj-jobs-page">
      <nav className="crumb">
        <Link href="/">Home</Link> <span>/</span> <Link href="/companies">Employer List</Link> <span>/</span> <span>{company.name}</span>
      </nav>

      <div className="panel" style={{ padding: 24, marginBottom: 22 }}>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="bdj-circ-logo" style={{ background: color }}>{initials(company.name)}</div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: 6 }}>{company.name}</h1>
            <div className="chips">
              {company.category && <span className="chip chip-blue">{company.category}</span>}
              {company.district && <span className="chip"><IconLocation width={13} height={13} /> {company.district.name}</span>}
              <span className="chip"><IconBuilding width={13} height={13} /> {activeJobs.length} live jobs</span>
            </div>
          </div>
        </div>
        {company.about && <p style={{ marginTop: 16, color: '#444' }}>{company.about}</p>}
        <div className="grid grid-3" style={{ marginTop: 16 }}>
          {company.address && <Info label="Address" value={company.address} />}
          {company.phone && <Info label="Phone" value={company.phone} />}
          {company.email && <Info label="Email" value={company.email} />}
          {company.website && <Info label="Website" value={<a href={company.website} target="_blank" rel="noreferrer" style={{ color: 'var(--bdj-blue)' }}>{company.website.replace(/^https?:\/\//, '')}</a>} />}
        </div>
      </div>

      <div className="sec-head">
        <h2>Live Jobs ({activeJobs.length})</h2>
      </div>
      {activeJobs.length > 0 ? (
        <div className="bdj-list">{activeJobs.map((j) => <JobListCard key={j.id} job={{ ...j, company }} />)}</div>
      ) : (
        <div className="state card card-pad">
          <h3>No live jobs right now</h3>
          <p>New openings from this employer will appear here.</p>
          <Link href="/jobs" className="btn">Browse all jobs</Link>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="dm" style={{ padding: 12 }}>
      <div className="k">{label}</div>
      <div className="v" style={{ marginTop: 4, fontSize: '.9rem' }}>{value}</div>
    </div>
  );
}
