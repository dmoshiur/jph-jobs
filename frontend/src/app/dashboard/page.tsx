'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import type { PackagePlan } from '@/types/api';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [packages, setPackages] = useState<PackagePlan[]>([]);
  const [message, setMessage] = useState('');
  useEffect(() => { void api.get<PackagePlan[]>('/packages').then(setPackages).catch(() => undefined); }, []);

  async function buy(packageId: string) {
    try {
      const data = await api.post<{ checkoutUrl: string }>('/payments/orders', { packageId, purpose: 'JOB_PACKAGE' });
      window.location.href = data.checkoutUrl;
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Payment initialization failed'); }
  }

  if (loading) return <main className="container section"><p>Loading...</p></main>;
  if (!user) return <main className="container section"><h1>Dashboard</h1><p>Please login to access candidate and employer tools.</p><Link className="button" href="/auth/login">Login</Link></main>;

  return <main className="container section"><h1>Dashboard</h1><p>Welcome, {user.name}. Backend permissions control every action.</p>{message && <p className="error">{message}</p>}<section className="grid three">{packages.map((pkg) => <article className="card" key={pkg.id}><span className="badge">{pkg.type}</span><h3>{pkg.name}</h3><div className="stat">৳{(pkg.price / 100).toLocaleString()}</div><ul>{pkg.features?.map((f) => <li key={f.id}>{f.value}</li>)}</ul><button onClick={() => void buy(pkg.id)} disabled={pkg.price === 0}>{pkg.price === 0 ? 'Free package' : 'Buy through backend'}</button></article>)}</section></main>;
}
