'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { JobCard } from '@/components/JobCard';
import { LoadingRows } from '@/components/ui/Feedback';
import { timeAgo, statusLabel, toBn } from '@/lib/format';
import type { Job } from '@/types/api';
import { IconBriefcase, IconUsers, IconCheck, IconChart, IconPlus, IconMoney } from '@/components/ui/Icons';

export default function EmployerDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<(Job & { _count?: { applications: number } })[]>([]);
  const [loading2, setLoading2] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login?next=/dashboard/employer');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    api.get<(Job & { _count?: { applications: number } })[]>('/jobs/mine/list').then(setJobs).catch(() => undefined).finally(() => setLoading2(false));
  }, [user]);

  if (loading || !user) return <div className="container section"><LoadingRows /></div>;

  const active = jobs.filter((j) => ['APPROVED', 'PUBLISHED'].includes(j.status)).length;
  const totalApplicants = jobs.reduce((s, j) => s + (j._count?.applications ?? 0), 0);
  const totalViews = jobs.reduce((s, j) => s + (j.views ?? 0), 0);

  return (
    <div className="container" style={{ padding: '22px 0' }}>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div>
          <h1 style={{ fontSize: '1.5rem' }}>{user.roles.includes('shop-owner') ? 'দোকান ড্যাশবোর্ড' : 'এমপ্লয়ার ড্যাশবোর্ড'}</h1>
          <p className="muted mb-0">স্বাগতম, {user.name}{user.memberships?.[0] ? ` · ${user.memberships[0].rank.toUpperCase()}` : ''}</p>
        </div>
        <Link href="/dashboard/employer/jobs/new" className="btn"><IconPlus width={16} height={16} /> নতুন চাকরি পোস্ট করুন</Link>
      </div>

      <div className="stat-cards">
        <Stat icon={<IconBriefcase />} num={active} label="সক্রিয় চাকরি" color="primary" />
        <Stat icon={<IconUsers />} num={totalApplicants} label="মোট আবেদন" color="success" />
        <Stat icon={<IconChart />} num={totalViews} label="মোট ভিউ" color="blue" />
        <Stat icon={<IconMoney />} num={jobs.length} label="মোট পোস্ট" color="amber" />
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) 300px', gap: 20, alignItems: 'start' }}>
        <div>
          <div className="panel-h" style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-lg) var(--r-lg) 0 0' }}><h3>আমার পোস্ট করা চাকরি</h3></div>
          {loading2 ? <LoadingRows /> : jobs.length === 0 ? (
            <div className="panel-b state" style={{ border: '1px solid var(--border)', borderTop: 'none' }}>
              <div className="state-icon">📝</div>
              <h3>এখনো কোনো চাকরি পোস্ট করেননি</h3>
              <Link href="/dashboard/employer/jobs/new" className="btn">এখনই পোস্ট করুন</Link>
            </div>
          ) : (
            <div className="table-wrap" style={{ borderTop: 'none', borderRadius: '0 0 var(--r-lg) var(--r-lg)' }}>
              <table className="table">
                <thead><tr><th>পদ</th><th>স্ট্যাটাস</th><th>আবেদন</th><th>ভিউ</th><th>সময়</th><th></th></tr></thead>
                <tbody>
                  {jobs.map((j) => (
                    <tr key={j.id}>
                      <td><Link href={`/jobs/${j.slug || j.id}`} style={{ color: 'var(--primary-700)', fontWeight: 600 }}>{j.title}</Link><div className="text-xs muted">{j.company?.name}</div></td>
                      <td><span className={`status-pill st-${j.status}`}>{statusLabel(j.status)}</span></td>
                      <td>{toBn(j._count?.applications ?? 0)}</td>
                      <td>{toBn(j.views ?? 0)}</td>
                      <td className="text-sm muted">{timeAgo(j.createdAt)}</td>
                      <td><Link className="btn btn-secondary btn-sm" href={`/dashboard/employer/jobs/${j.id}/applicants`}><IconUsers width={13} height={13} /> আবেদনকারী</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="panel card-pad" style={{ display: 'grid', gap: 10 }}>
          <h3 style={{ margin: 0 }}>দ্রুত অ্যাকশন</h3>
          <Link href="/dashboard/employer/jobs/new" className="btn btn-secondary"><IconPlus width={15} height={15} /> নতুন চাকরি</Link>
          <Link href="/dashboard/employer/packages" className="btn btn-secondary"><IconMoney width={15} height={15} /> প্যাকেজ ও পেমেন্ট</Link>
          <Link href="/dashboard/employer/profile" className="btn btn-secondary">কোম্পানি / দোকান প্রোফাইল</Link>
          <Link href="/dashboard/employer/team" className="btn btn-secondary">টিম ও র‍্যাঙ্ক (MD/GM/AGM)</Link>
          <Link href="/dashboard" className="btn btn-ghost">← প্রার্থী ড্যাশবোর্ড</Link>
        </aside>
      </div>
    </div>
  );
}

function Stat({ icon, num, label, color }: { icon: React.ReactNode; num: number; label: string; color: string }) {
  const bg: Record<string, string> = { primary: 'var(--primary-50)', success: 'var(--success-50)', blue: 'var(--secondary-50)', amber: '#fffbeb' };
  const clr: Record<string, string> = { primary: 'var(--primary-600)', success: 'var(--success-600)', blue: 'var(--secondary-600)', amber: 'var(--warning-600)' };
  return (
    <div className="stat-card"><div className="sc-ic" style={{ background: bg[color], color: clr[color] }}>{icon}</div><div className="sc-num">{toBn(num)}</div><div className="sc-lbl">{label}</div></div>
  );
}
