'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api, ApiError } from '@/services/api';
import type { PackagePlan } from '@/types/api';
import { useToast } from '@/components/ui/Toast';
import { IconCheck } from '@/components/ui/Icons';

export default function PackagesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [packages, setPackages] = useState<PackagePlan[]>([]);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
    api.get<PackagePlan[]>('/packages').then((p) => setPackages(p.filter((x) => x.type === 'JOB'))).catch(() => undefined);
  }, [user, loading, router]);

  async function buy(pkg: PackagePlan, jobId?: string) {
    if (pkg.price === 0) { toast('ফ্রি প্যাকেজ সক্রিয়', 'success'); return; }
    setBusy(pkg.id);
    try {
      const data = await api.post<{ checkoutUrl: string }>('/payments/orders', { packageId: pkg.id, purpose: 'JOB_PACKAGE', jobId });
      window.location.href = data.checkoutUrl;
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'পেমেন্ট শুরু করা যায়নি', 'error');
    } finally { setBusy(''); }
  }

  return (
    <div className="container" style={{ padding: '24px 0', maxWidth: 960 }}>
      <nav className="crumb"><Link href="/dashboard/employer">ড্যাশবোর্ড</Link> <span>/</span> <span>প্যাকেজ</span></nav>
      <h1 style={{ fontSize: '1.5rem' }}>প্যাকেজ ও মূল্য</h1>
      <p className="muted">আপনার চাকরির পোস্টে বেশি প্রার্থী পেতে উপযুক্ত প্যাকেজ নির্বাচন করুন।</p>
      <div className="grid grid-3" style={{ gap: 16, marginTop: 20 }}>
        {packages.map((p) => (
          <div key={p.id} className="panel card-pad" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: 0 }}>{p.name}</h3>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-700)', margin: '8px 0' }}>৳{(p.price / 100).toLocaleString('bn-BD')}</div>
            <div className="text-sm muted" style={{ marginBottom: 12 }}>{p.durationDays} দিন সক্রিয়</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', display: 'grid', gap: 8, flex: 1 }}>
              {p.features?.map((f) => (
                <li key={f.id} style={{ display: 'flex', gap: 8, alignItems: 'start', fontSize: '.9rem' }}>
                  <span style={{ color: 'var(--success-500)' }}><IconCheck width={16} height={16} /></span>
                  {f.key === 'tier' ? `${f.value} টিয়ার` : f.value === '1' ? f.key.replace(/_/g, ' ') : `${f.key}: ${f.value}`}
                </li>
              ))}
            </ul>
            <button className={p.price === 0 ? 'btn btn-secondary' : 'btn'} disabled={busy === p.id} onClick={() => buy(p)}>{busy === p.id ? 'অপেক্ষা…' : p.price === 0 ? 'ফ্রি' : 'কিনুন'}</button>
          </div>
        ))}
      </div>
      <p className="text-sm muted center mt-6">পেমেন্ট সম্পূর্ণ ব্যাকএন্ড-নিয়ন্ত্রিত ও SSLCommerz-সক্ষম। সফল পেমেন্টের পর চাকরি স্বয়ংক্রিয়ভাবে সক্রিয় হয়।</p>
    </div>
  );
}
