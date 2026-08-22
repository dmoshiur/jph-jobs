import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { API_URL } from '@/services/api';
import { JobCard } from '@/components/JobCard';
import { formatDate, initials, toBn } from '@/lib/format';
import { IconLocation, IconPhone, IconMail, IconGlobe, IconCheck, IconBuilding } from '@/components/ui/Icons';

export const revalidate = 300;

async function getCompany(id: string) {
  try {
    const res = await fetch(`${API_URL}/companies/${id}`, { next: { revalidate: 120 } });
    if (!res.ok) return null;
    return (await res.json()).data;
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) return { title: 'কোম্পানি পাওয়া যায়নি' };
  return { title: `${company.name} — চাকরি ও তথ্য`, description: company.about ?? `${company.name} বগুড়া/জয়পুরহাটের একটি নিয়োগদাতা প্রতিষ্ঠান।` };
}

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) notFound();
  const activeJobs = company.jobs ?? [];

  const structured = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: company.name,
    ...(company.website ? { url: company.website } : {}),
    address: { '@type': 'PostalAddress', addressLocality: [company.upazila?.name, company.district?.name].filter(Boolean).join(', '), addressCountry: 'BD' }
  };

  return (
    <div className="container" style={{ paddingTop: 18 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured) }} />
      <nav className="crumb"><Link href="/">হোম</Link> <span>/</span> <Link href="/companies">কোম্পানি</Link> <span>/</span> <span>{company.name}</span></nav>

      <div className="panel" style={{ padding: 24, marginBottom: 22 }}>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="job-logo" style={{ width: 84, height: 84, fontSize: '1.8rem', borderRadius: 18 }}>{initials(company.name)}</div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <h1 style={{ fontSize: '1.6rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {company.name}
              {company.verificationStatus === 'VERIFIED' && <span className="badge badge-verified">ভেরিফাইড</span>}
            </h1>
            <div className="chips">
              {company.category && <span className="chip chip-blue">{company.category}</span>}
              {company.district && <span className="chip"><IconLocation width={13} height={13} /> {[company.upazila?.name, company.district.name].filter(Boolean).join(', ')}</span>}
              <span className="chip"><IconBuilding width={13} height={13} /> {toBn(activeJobs.length)} টি খোলা চাকরি</span>
            </div>
          </div>
        </div>

        {company.about && <p style={{ marginTop: 16, color: 'var(--gray-700)', whiteSpace: 'pre-wrap' }}>{company.about}</p>}

        <div className="grid grid-3" style={{ marginTop: 18 }}>
          {company.address && <Info icon={<IconLocation width={16} height={16} />} label="ঠিকানা" value={company.address} />}
          {company.phone && <Info icon={<IconPhone width={16} height={16} />} label="ফোন" value={company.phone} />}
          {company.email && <Info icon={<IconMail width={16} height={16} />} label="ইমেইল" value={company.email} />}
          {company.website && <Info icon={<IconGlobe width={16} height={16} />} label="ওয়েবসাইট" value={<a href={company.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-600)' }}>{company.website.replace(/^https?:\/\//, '')}</a>} />}
        </div>
      </div>

      <div className="sec-head">
        <h2>খোলা চাকরি ({toBn(activeJobs.length)})</h2>
        {activeJobs.length > 0 && <Link href={`/jobs?companyId=${company.id}`}>সব দেখুন</Link>}
      </div>
      {activeJobs.length > 0 ? (
        <div className="grid grid-2">{activeJobs.map((j: any) => <JobCard key={j.id} job={j} />)}</div>
      ) : (
        <div className="state card card-pad"><div className="state-icon">📭</div><h3>এই মুহূর্তে কোনো চাকরি নেই</h3><p>নতুন চাকরি প্রকাশিত হলে এখানে দেখানো হবে।</p><Link href="/jobs" className="btn">অন্য চাকরি দেখুন</Link></div>
      )}
    </div>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="dm" style={{ padding: 12 }}>
      <div className="k" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{icon} {label}</div>
      <div className="v" style={{ marginTop: 4, fontSize: '.9rem' }}>{value}</div>
    </div>
  );
}
