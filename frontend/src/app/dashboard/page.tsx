'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { ErrorState, LoadingRows } from '@/components/ui/Feedback';
import { JobCard } from '@/components/JobCard';
import { timeAgo, statusLabel, toBn } from '@/lib/format';
import type { Application, Job } from '@/types/api';
import { IconBriefcase, IconBookmark, IconBell, IconCheck, IconChart } from '@/components/ui/Icons';

export default function CandidateDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [saved, setSaved] = useState<Job[]>([]);
  const [tab, setTab] = useState<'applications' | 'saved' | 'alerts'>('applications');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login?next=/dashboard');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get<Application[]>('/applications').then(setApplications).catch(() => undefined),
      api.get<Job[]>('/saved-jobs').then(setSaved).catch(() => undefined)
    ]);
  }, [user]);

  if (loading || !user) return <div className="container section"><LoadingRows /></div>;

  const isEmployer = user.roles.some((r) => ['employer', 'shop-owner'].includes(r));
  const isAdmin = user.roles.some((r) => ['root-admin', 'super-admin'].includes(r));
  const stats = {
    applications: applications.length,
    shortlisted: applications.filter((a) => ['SHORTLISTED', 'INTERVIEW', 'SELECTED'].includes(a.status)).length,
    interviews: applications.filter((a) => a.status === 'INTERVIEW').length,
    saved: saved.length
  };

  return (
    <div className="container dash-grid">
      <aside className="dash-side card card-pad">
        <div style={{ padding: '8px 10px 14px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
          <div style={{ fontWeight: 700 }}>{user.name}</div>
          <div className="text-sm muted ellipsis">{user.email}</div>
        </div>
        <a className={tab === 'applications' ? 'active' : ''} onClick={() => setTab('applications')}><IconBriefcase width={16} height={16} /> আমার আবেদন</a>
        <a className={tab === 'saved' ? 'active' : ''} onClick={() => setTab('saved')}><IconBookmark width={16} height={16} /> সংরক্ষিত চাকরি</a>
        <a className={tab === 'alerts' ? 'active' : ''} onClick={() => setTab('alerts')}><IconBell width={16} height={16} /> চাকরির এলার্ট</a>
        <Link href="/dashboard/cv"><IconCheck width={16} height={16} style={{ display: 'inline', verticalAlign: -3 }} /> সিভি/প্রোফাইল</Link>
        {isEmployer && <Link href="/dashboard/employer" style={{ color: 'var(--primary-700)', fontWeight: 700 }}>🏢 এমপ্লয়ার ড্যাশবোর্ড</Link>}
        {isAdmin && <Link href="/admin" style={{ color: 'var(--primary-700)', fontWeight: 700 }}>⚙️ অ্যাডমিন প্যানেল</Link>}
      </aside>

      <main>
        <h1 style={{ fontSize: '1.5rem' }}>আমার ড্যাশবোর্ড</h1>
        <p className="muted">স্বাগতম, {user.name}। আপনার সব কার্যক্রম এখানে।</p>

        <div className="stat-cards">
          <StatCard color="primary" icon={<IconBriefcase />} num={stats.applications} label="মোট আবেদন" />
          <StatCard color="success" icon={<IconCheck />} num={stats.shortlisted} label="শর্টলিস্টেড" />
          <StatCard color="blue" icon={<IconBell />} num={stats.interviews} label="ইন্টারভিউ" />
          <StatCard color="amber" icon={<IconBookmark />} num={stats.saved} label="সংরক্ষিত" />
        </div>

        <div className="panel" style={{ overflow: 'hidden' }}>
          <div className="panel-h"><h3>{tab === 'applications' ? 'আমার আবেদন' : tab === 'saved' ? 'সংরক্ষিত চাকরি' : 'চাকরির এলার্ট'}</h3></div>
          {error ? <div className="panel-b"><ErrorState /></div>
            : tab === 'applications' ? <ApplicationsTable applications={applications} />
            : tab === 'saved' ? (
              <div className="panel-b">
                {saved.length === 0 ? <Empty text="এখনো কোনো চাকরি সংরক্ষণ করেননি।" cta={{ label: 'চাকরি খুঁজুন', href: '/jobs' }} />
                  : <div className="grid grid-2">{saved.map((j) => <JobCard key={j.id} job={j} />)}</div>}
              </div>
            ) : <AlertsTab />}
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, num, label, color }: { icon: React.ReactNode; num: number; label: string; color: string }) {
  const bg: Record<string, string> = { primary: 'var(--primary-50)', success: 'var(--success-50)', blue: 'var(--secondary-50)', amber: '#fffbeb' };
  const clr: Record<string, string> = { primary: 'var(--primary-600)', success: 'var(--success-600)', blue: 'var(--secondary-600)', amber: 'var(--warning-600)' };
  return (
    <div className="stat-card">
      <div className="sc-ic" style={{ background: bg[color], color: clr[color] }}>{icon}</div>
      <div className="sc-num">{toBn(num)}</div>
      <div className="sc-lbl">{label}</div>
    </div>
  );
}

function ApplicationsTable({ applications }: { applications: Application[] }) {
  if (applications.length === 0) return <div className="panel-b"><Empty text="আপনি এখনো কোনো চাকরিতে আবেদন করেননি।" cta={{ label: 'চাকরি খুঁজুন', href: '/jobs' }} /></div>;
  return (
    <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
      <table className="table">
        <thead><tr><th>পদের নাম</th><th>কোম্পানি</th><th>আবেদনের সময়</th><th>স্ট্যাটাস</th></tr></thead>
        <tbody>
          {applications.map((a) => (
            <tr key={a.id}>
              <td><Link href={`/jobs/${a.job?.slug || a.jobId}`} style={{ color: 'var(--primary-700)', fontWeight: 600 }}>{a.job?.title}</Link></td>
              <td>{a.job?.company?.name}</td>
              <td className="text-sm muted">{timeAgo(a.createdAt)}</td>
              <td><span className={`status-pill st-${a.status}`}>{statusLabel(a.status)}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AlertsTab() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [q, setQ] = useState('');
  useEffect(() => { api.get<any[]>('/job-alerts').then(setAlerts).catch(() => undefined); }, []);
  async function create() {
    if (!q.trim()) return;
    const a = await api.post('/job-alerts', { query: { q }, frequency: 'daily' });
    setAlerts((s) => [a, ...s]); setQ('');
  }
  return (
    <div className="panel-b">
      <div className="flex gap-2 mb-4">
        <input placeholder="কীওয়ার্ড দিয়ে এলার্ট তৈরি করুন" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && create()} />
        <button className="btn" onClick={create}>এলার্ট তৈরি</button>
      </div>
      {alerts.length === 0 ? <p className="muted center">কোনো এলার্ট নেই।</p> : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {alerts.map((a: any) => <li key={a.id} className="flex justify-between items-center" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <span><IconBell width={14} height={14} style={{ verticalAlign: -2, color: 'var(--primary-500)' }} /> {(a.query as any)?.q ?? 'কাস্টম এলার্ট'} <span className="badge badge-gray">{a.frequency}</span></span>
            <button className="btn btn-ghost btn-sm text-danger" onClick={async () => { await api.delete(`/job-alerts/${a.id}`); setAlerts((s) => s.filter((x) => x.id !== a.id)); }}>মুছুন</button>
          </li>)}
        </ul>
      )}
    </div>
  );
}

function Empty({ text, cta }: { text: string; cta?: { label: string; href: string } }) {
  return (
    <div className="state" style={{ padding: '32px 12px' }}>
      <div className="state-icon">📭</div>
      <p>{text}</p>
      {cta && <Link href={cta.href} className="btn">{cta.label}</Link>}
    </div>
  );
}
