'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/services/api';
import { LoadingRows } from '@/components/ui/Feedback';
import { toBn, statusLabel, timeAgo } from '@/lib/format';
import { IconUsers, IconBriefcase, IconBuilding, IconStore, IconMoney, IconBell, IconChart } from '@/components/ui/Icons';

interface Analytics {
  totalUsers: number; candidates: number; employers: number; companies: number; businesses: number;
  activeJobs: number; pendingJobs: number; applications: number; revenue: number; paymentSuccessRate: number;
}
interface Audit { id: string; action: string; resource: string; createdAt: string; admin?: { name: string; email: string } }

export default function AdminDashboard() {
  const [stats, setStats] = useState<Analytics | null>(null);
  const [logs, setLogs] = useState<Audit[]>([]);

  useEffect(() => {
    api.get<Analytics>('/admin/analytics').then(setStats).catch(() => undefined);
    api.get<{ items: Audit[] }>('/admin/audit-logs?limit=10').then((d) => setLogs(d.items)).catch(() => undefined);
  }, []);

  if (!stats) return <div className="container"><LoadingRows /></div>;

  const cards = [
    { label: 'মোট ব্যবহারকারী', value: stats.totalUsers, icon: <IconUsers />, color: 'primary', href: '/admin/users' },
    { label: 'সক্রিয় চাকরি', value: stats.activeJobs, icon: <IconBriefcase />, color: 'success', href: '/admin/jobs' },
    { label: 'অনুমোদন অপেক্ষমান', value: stats.pendingJobs, icon: <IconBell />, color: 'amber', href: '/admin/jobs' },
    { label: 'কোম্পানি', value: stats.companies, icon: <IconBuilding />, color: 'blue', href: '/admin/companies' },
    { label: 'ব্যবসা', value: stats.businesses, icon: <IconStore />, color: 'primary', href: '/admin/businesses' },
    { label: 'আবেদন', value: stats.applications, icon: <IconChart />, color: 'success', href: '/admin/applications' },
    { label: 'রাজস্ব (৳)', value: (stats.revenue / 100).toLocaleString('bn-BD'), icon: <IconMoney />, color: 'blue', href: '/admin/payments' },
    { label: 'পেমেন্ট সাফল্য', value: `${toBn(Math.round(stats.paymentSuccessRate * 100))}%`, icon: <IconMoney />, color: 'amber', href: '/admin/payments' }
  ];

  return (
    <div>
      <div className="grid grid-4" style={{ gap: 14 }}>
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="stat-card" style={{ textDecoration: 'none' }}>
            <div className="sc-ic" style={{ background: `var(--${c.color === 'amber' ? 'warning-100' : c.color + '-100'})`, color: `var(--${c.color === 'amber' ? 'warning-600' : c.color + '-600'})` }}>{c.icon}</div>
            <div className="sc-num">{typeof c.value === 'number' ? toBn(c.value) : c.value}</div>
            <div className="sc-lbl">{c.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr', gap: 18, marginTop: 22 }}>
        <div className="panel">
          <div className="panel-h"><h3>সাম্প্রতিক কার্যক্রম</h3><Link href="/admin/audit" style={{ color: 'var(--primary-600)', fontWeight: 600, fontSize: '.85rem' }}>সব দেখুন</Link></div>
          <div className="table-wrap" style={{ border: 'none' }}>
            <table className="table">
              <thead><tr><th>অ্যাকশন</th><th>রিসোর্স</th><th>অ্যাডমিন</th><th>সময়</th></tr></thead>
              <tbody>
                {logs.length === 0 ? <tr><td colSpan={4} className="center muted" style={{ padding: 24 }}>কোনো লগ নেই</td></tr>
                  : logs.map((l) => (
                    <tr key={l.id}>
                      <td><code style={{ fontSize: '.78rem', background: 'var(--gray-100)', padding: '2px 6px', borderRadius: 4 }}>{l.action}</code></td>
                      <td>{l.resource}</td>
                      <td className="text-sm">{l.admin?.name ?? '—'}</td>
                      <td className="text-sm muted">{timeAgo(l.createdAt)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel card-pad">
          <h3>দ্রুত লিংক</h3>
          <div className="grid" style={{ gap: 8, marginTop: 10 }}>
            <Link href="/admin/jobs" className="btn btn-secondary">চাকরি অনুমোদন ({toBn(stats.pendingJobs)})</Link>
            <Link href="/admin/companies" className="btn btn-secondary">কোম্পানি ভেরিফাই</Link>
            <Link href="/admin/payments" className="btn btn-secondary">পেমেন্ট দেখুন</Link>
            <Link href="/admin/admins" className="btn btn-secondary">অ্যাডমিন ব্যবস্থাপনা</Link>
            <Link href="/admin/settings" className="btn btn-secondary">সেটিংস</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
