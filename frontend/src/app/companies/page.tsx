'use client';
import { useEffect, useState } from 'react';
import { CompanyCard } from '@/components/CompanyCard';
import { api } from '@/services/api';
import type { Company, Paginated } from '@/types/api';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [error, setError] = useState('');
  useEffect(() => { void api.get<Paginated<Company>>('/companies').then((data) => setCompanies(data.items)).catch((err) => setError(err.message)); }, []);
  return <main className="container section"><h1>Company directory</h1>{error && <p className="error">{error}</p>}<div className="grid three">{companies.map((company) => <CompanyCard key={company.id} company={company} />)}</div></main>;
}
