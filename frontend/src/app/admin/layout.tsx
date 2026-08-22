'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoadingRows } from '@/components/ui/Feedback';
import {
  IconChart, IconUsers, IconBuilding, IconStore, IconBriefcase, IconMoney,
  IconCog, IconDocument, IconBell, IconLocation, IconStar, IconLogout, IconMenu, IconX, IconCheck
} from '@/components/ui/Icons';

const NAV = [
  { href: '/admin', label: 'ড্যাশবোর্ড', icon: <IconChart width={16} height={16} />, exact: true },
  { sect: 'ম্যানেজমেন্ট' },
  { href: '/admin/users', label: 'ব্যবহারকারী', icon: <IconUsers width={16} height={16} /> },
  { href: '/admin/jobs', label: 'চাকরি', icon: <IconBriefcase width={16} height={16} /> },
  { href: '/admin/companies', label: 'কোম্পানি', icon: <IconBuilding width={16} height={16} /> },
  { href: '/admin/businesses', label: 'ব্যবসা', icon: <IconStore width={16} height={16} /> },
  { href: '/admin/applications', label: 'আবেদন', icon: <IconDocument width={16} height={16} /> },
  { sect: 'আর্থিক' },
  { href: '/admin/payments', label: 'পেমেন্ট', icon: <IconMoney width={16} height={16} /> },
  { href: '/admin/packages', label: 'প্যাকেজ', icon: <IconStar width={16} height={16} /> },
  { sect: 'কন্টেন্ট' },
  { href: '/admin/categories', label: 'ক্যাটাগরি', icon: <IconCheck width={16} height={16} /> },
  { href: '/admin/locations', label: 'লোকেশন', icon: <IconLocation width={16} height={16} /> },
  { href: '/admin/reports', label: 'রিপোর্ট', icon: <IconBell width={16} height={16} /> },
  { href: '/admin/reviews', label: 'রিভিউ', icon: <IconStar width={16} height={16} /> },
  { sect: 'সিস্টেম' },
  { href: '/admin/admins', label: 'অ্যাডমিন', icon: <IconUsers width={16} height={16} /> },
  { href: '/admin/audit', label: 'অডিট লগ', icon: <IconDocument width={16} height={16} /> },
  { href: '/admin/settings', label: 'সেটিংস', icon: <IconCog width={16} height={16} /> }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, hasPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login?next=/admin');
  }, [user, loading, router]);

  if (loading || !user) return <div className="container section"><LoadingRows /></div>;
  const isAdmin = user.roles.some((r) => ['root-admin', 'super-admin'].includes(r));
  if (!isAdmin) {
    return (
      <div className="container section center">
        <div className="panel card-pad" style={{ maxWidth: 480, margin: '40px auto' }}>
          <h1>অ্যাক্সেস নেই</h1>
          <p>এই পৃষ্ঠা দেখার অনুমতি আপনার নেই।</p>
          <Link href="/" className="btn">হোমে ফিরুন</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <aside className={`admin-side ${mobileOpen ? 'admin-mobile-open' : ''}`}>
        <Link href="/" className="logo"><span className="logo-mark">JH</span> JOBHUB</Link>
        <nav>
          {NAV.map((item, i) => {
            if ('sect' in item) return <div key={i} className="nav-sect">{item.sect}</div>;
            const active = item!.exact ? pathname === item!.href : pathname.startsWith(item!.href);
            return <Link key={item!.href} href={item!.href} className={active ? 'active' : ''} onClick={() => setMobileOpen(false)}>{item!.icon} {item!.label}</Link>;
          })}
        </nav>
        <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12 }}>
          <div style={{ padding: 10, color: '#cdd9f5', fontSize: '.8rem', borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: 12 }}>
            <div style={{ fontWeight: 700, color: '#fff' }}>{user.name}</div>
            <div style={{ fontSize: '.72rem', opacity: .8 }}>{user.roles.join(', ')}</div>
            <button onClick={() => { void logout(); router.push('/'); }} style={{ marginTop: 8, background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', padding: '8px 12px', borderRadius: 8, width: '100%', cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center' }}><IconLogout width={14} height={14} /> লগআউট</button>
          </div>
        </div>
      </aside>

      <div className="admin-main">
        <div className="admin-topbar">
          <button className="m-icon-btn" style={{ display: 'none' }} onClick={() => setMobileOpen(true)}><IconMenu width={20} height={20} /></button>
          <h1>অ্যাডমিন প্যানেল</h1>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="admin-badge">{user.roles.includes('root-admin') ? 'রুট অ্যাডমিন' : 'সুপার অ্যাডমিন'}</span>
            <button className="m-icon-btn" onClick={() => setMobileOpen(true)} aria-label="মেনু" style={{ background: '#fff', border: '1px solid var(--border)' }}><IconMenu width={18} height={18} /></button>
          </div>
        </div>
        {mobileOpen && <div className="drawer-backdrop open" onClick={() => setMobileOpen(false)}><button style={{ position: 'absolute', top: 16, right: 16, color: '#fff' }} onClick={() => setMobileOpen(false)}><IconX width={24} height={24} /></button></div>}
        {children}
      </div>
    </div>
  );
}
