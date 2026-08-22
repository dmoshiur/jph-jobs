'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api, ApiError } from '@/services/api';
import type { Application } from '@/types/api';
import { statusLabel, timeAgo } from '@/lib/format';
import { useToast } from '@/components/ui/Toast';

const STATUSES = ['VIEWED', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED'];

export default function ApplicantsPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [apps, setApps] = useState<Application[]>([]);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
    if (!user) return;
    api.get<Application[]>(`/jobs/${id}/applicants`).then(setApps).catch((e) => setLoadError(e instanceof Error ? e.message : 'লোড ব্যর্থ'));
  }, [user, loading, id, router]);

  async function change(appId: string, status: string) {
    try {
      await api.patch(`/applications/${appId}/status`, { status });
      setApps((s) => s.map((a) => a.id === appId ? { ...a, status } : a));
      toast('স্ট্যাটাস আপডেট হয়েছে', 'success');
    } catch (e) { toast(e instanceof Error ? e.message : 'ব্যর্থ', 'error'); }
  }

  return (
    <div className="container" style={{ padding: '22px 0' }}>
      <nav className="crumb"><Link href="/dashboard/employer">ড্যাশবোর্ড</Link> <span>/</span> <span>আবেদনকারী</span></nav>
      <h1 style={{ fontSize: '1.4rem' }}>আবেদনকারীদের তালিকা</h1>
      {loadError ? <div className="alert alert-error">{loadError}</div> : apps.length === 0 ? (
        <div className="panel card-pad state"><div className="state-icon">📭</div><h3>কোনো আবেদন নেই</h3></div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>প্রার্থী</th><th>যোগাযোগ</th><th>জমার সময়</th><th>স্ট্যাটাস</th><th>পরিবর্তন</th></tr></thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.id}>
                  <td><strong>{a.candidate?.name}</strong>{a.candidate?.candidateProfile?.title && <div className="text-xs muted">{a.candidate.candidateProfile.title}</div>}</td>
                  <td className="text-sm">{a.candidate?.email}<br />{a.candidate?.phone ?? ''}</td>
                  <td className="text-sm muted">{timeAgo(a.createdAt)}</td>
                  <td><span className={`status-pill st-${a.status}`}>{statusLabel(a.status)}</span></td>
                  <td>
                    <select value={a.status} onChange={(e) => change(a.id, e.target.value)} style={{ width: 'auto', padding: '6px 10px' }}>
                      {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
