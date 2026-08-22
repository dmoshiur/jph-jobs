import type { Company } from '@/types/api';

export function CompanyCard({ company }: { company: Company }) {
  return (
    <article className="card">
      <span className="badge">{company.verificationStatus === 'VERIFIED' ? 'Verified' : 'Listed'}</span>
      <h3>{company.name}</h3>
      <p>{company.about ?? company.category ?? 'Local employer'}</p>
      <p>{company.district?.name ?? 'Bangladesh'} · {company._count?.jobs ?? 0} jobs</p>
    </article>
  );
}
