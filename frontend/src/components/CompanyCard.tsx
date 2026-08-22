import Link from 'next/link';
import type { Company } from '@/types/api';
import { initials, toBn } from '@/lib/format';
import { IconLocation, IconBriefcase } from '@/components/ui/Icons';

export function CompanyCard({ company }: { company: Company }) {
  return (
    <Link href={`/companies/${company.slug || company.id}`} className="company-card">
      <div className="company-logo">{initials(company.name)}</div>
      <h3>
        {company.name}
        {company.verificationStatus === 'VERIFIED' && <span className="badge badge-verified" style={{ fontSize: '.66rem', padding: '1px 7px' }}>ভেরিফাইড</span>}
      </h3>
      <div className="meta" style={{ display: 'grid', gap: 4, marginTop: 6 }}>
        <span><IconLocation width={13} height={13} style={{ display: 'inline', verticalAlign: -2 }} /> {company.district?.name ?? 'বগুড়া/জয়পুরহাট'}</span>
        {company.category && <span>{company.category}</span>}
        <span style={{ color: 'var(--primary-600)', fontWeight: 700 }}><IconBriefcase width={13} height={13} style={{ display: 'inline', verticalAlign: -2 }} /> {toBn(company._count?.jobs ?? 0)} টি চাকরি খোলা</span>
      </div>
    </Link>
  );
}
