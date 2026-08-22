'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  IconSearch, IconBell, IconMenu, IconX, IconBriefcase, IconBuilding, IconStore,
  IconBookmark, IconUser, IconPlus, IconHome, IconHeart, IconGraduation, IconLogout, IconCog, IconChevronDown, IconStar
} from '@/components/ui/Icons';

const mainLinks = [
  { href: '/jobs', label: 'চাকরি' },
  { href: '/companies', label: 'কোম্পানি' },
  { href: '/businesses', label: 'ব্যবসা' },
  { href: '/resources', label: 'ক্যারিয়ার' },
  { href: '/training', label: 'ট্রেনিং' }
];

export function Header() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => { setDrawerOpen(false); setAccountOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const isAdmin = user?.roles?.some((r) => ['root-admin', 'super-admin'].includes(r));
  const isEmployer = user?.roles?.includes('employer');

  return (
    <>
      {/* Top utility bar */}
      <div className="topbar">
        <div className="container topbar-inner">
          <div className="topbar-links">
            <Link href="/jobs">চাকরি</Link>
            <Link href="/companies">কোম্পানি</Link>
            <Link href="/businesses">ব্যবসা প্রতিষ্ঠান</Link>
            <Link href="/resources">ক্যারিয়ার রিসোর্স</Link>
            <Link href="/help">সাহায্য</Link>
          </div>
          <div className="topbar-right">
            <span>📞 ০৯৬১২-xxx-xxx</span>
            <span className="divider" />
            <Link href="/contact">যোগাযোগ</Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className="header">
        <div className="container header-inner">
          <Link href="/" className="logo" aria-label="JOBHUB হোম">
            <span className="logo-mark">JH</span>
            <span>JOB<span style={{ color: 'var(--secondary-500)' }}>HUB</span></span>
          </Link>

          <nav className="main-nav" aria-label="প্রধান নেভিগেশন">
            {mainLinks.map((l) => (
              <Link key={l.href} href={l.href} className={pathname === l.href ? 'active' : ''}>{l.label}</Link>
            ))}
          </nav>

          <div className="header-actions">
            <Link href="/jobs" className="m-icon-btn btn-desktop" aria-label="খুঁজুন" style={{ display: 'grid' }}><IconSearch width={18} height={18} /></Link>
            {user && <Link href="/notifications" className="m-icon-btn btn-desktop" aria-label="নোটিফিকেশন" style={{ display: 'grid' }}><IconBell width={18} height={18} /></Link>}
            {!loading && !user && (
              <>
                <Link href="/auth/login" className="btn btn-secondary btn-sm btn-desktop">লগইন</Link>
                <Link href="/auth/register" className="btn btn-sm btn-desktop">অ্যাকাউন্ট খুলুন</Link>
              </>
            )}
            {user && (
              <div className="btn-desktop" style={{ position: 'relative' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setAccountOpen((v) => !v)} aria-haspopup="true" aria-expanded={accountOpen}>
                  <IconUser width={16} height={16} /> {user.name.split(' ')[0]} <IconChevronDown width={14} height={14} />
                </button>
                {accountOpen && (
                  <div className="panel" style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', minWidth: 220, zIndex: 50, padding: 6 }}>
                    <Link href="/dashboard" className="ql-list" style={{ display: 'block' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, color: 'var(--gray-800)', fontWeight: 600 }}><IconCog width={16} height={16} /> ড্যাশবোর্ড</span>
                    </Link>
                    {isEmployer && <Link href="/dashboard/employer/jobs" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, color: 'var(--gray-800)', fontWeight: 600 }}><IconBriefcase width={16} height={16} /> এমপ্লয়ার প্যানেল</Link>}
                    {isAdmin && <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, color: 'var(--primary-700)', fontWeight: 700 }}><IconCog width={16} height={16} /> অ্যাডমিন প্যানেল</Link>}
                    <button onClick={() => { void logout(); router.push('/'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 8, color: 'var(--danger-600)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: '.9rem' }}><IconLogout width={16} height={16} /> লগআউট</button>
                  </div>
                )}
              </div>
            )}
            <Link href={user ? (isEmployer ? '/dashboard/employer/jobs/new' : '/employers/post-job') : '/employers/post-job'} className="btn btn-sm btn-desktop"><IconPlus width={16} height={16} /> চাকরি পোস্ট করুন</Link>

            {/* Mobile controls */}
            <button className="m-icon-btn" aria-label="মেনু" onClick={() => setDrawerOpen(true)}><IconMenu width={22} height={22} /></button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div className={`drawer-backdrop ${drawerOpen ? 'open' : ''}`} onClick={() => setDrawerOpen(false)} />
      <aside className={`drawer ${drawerOpen ? 'open' : ''}`} aria-hidden={!drawerOpen}>
        <div className="drawer-h">
          <Link href="/" className="logo"><span className="logo-mark">JH</span> JOBHUB</Link>
          <button className="m-icon-btn" aria-label="বন্ধ করুন" onClick={() => setDrawerOpen(false)}><IconX width={20} height={20} /></button>
        </div>
        <nav className="drawer-nav">
          <div className="drawer-section">খুঁজুন</div>
          <Link href="/jobs"><span className="ic"><IconSearch width={18} height={18} /></span> চাকরি খুঁজুন</Link>
          <Link href="/companies"><span className="ic"><IconBuilding width={18} height={18} /></span> কোম্পানি</Link>
          <Link href="/businesses"><span className="ic"><IconStore width={18} height={18} /></span> ব্যবসা প্রতিষ্ঠান</Link>
          <Link href="/jobs?featured=true"><span className="ic"><IconStar /><span style={{ display: 'none' }}/></span> ফিচার্ড চাকরি</Link>

          <div className="drawer-section">প্রার্থী</div>
          {user ? (
            <>
              <Link href="/dashboard"><span className="ic"><IconUser width={18} height={18} /></span> আমার অ্যাকাউন্ট</Link>
              <Link href="/dashboard/saved"><span className="ic"><IconBookmark width={18} height={18} /></span> সংরক্ষিত চাকরি</Link>
              <Link href="/dashboard/alerts"><span className="ic"><IconBell width={18} height={18} /></span> চাকরির এলার্ট</Link>
              <Link href="/dashboard/cv"><span className="ic"><IconGraduation width={18} height={18} /></span> সিভি তৈরি</Link>
            </>
          ) : (
            <>
              <Link href="/auth/login"><span className="ic"><IconUser width={18} height={18} /></span> লগইন</Link>
              <Link href="/auth/register"><span className="ic"><IconPlus width={18} height={18} /></span> নিবন্ধন</Link>
            </>
          )}

          <div className="drawer-section">নিয়োগদাতা</div>
          <Link href="/employers/post-job"><span className="ic"><IconPlus width={18} height={18} /></span> চাকরি পোস্ট করুন</Link>
          <Link href="/dashboard/employer"><span className="ic"><IconBriefcase width={18} height={18} /></span> এমপ্লয়ার ড্যাশবোর্ড</Link>

          <div className="drawer-section">অন্যান্য</div>
          <Link href="/help"><span className="ic"><IconHeart width={18} height={18} /></span> সাহায্য</Link>
          {isAdmin && <Link href="/admin"><span className="ic"><IconCog width={18} height={18} /></span> অ্যাডমিন প্যানেল</Link>}
          {user && <button onClick={() => { void logout(); router.push('/'); }}><span className="ic"><IconLogout width={18} height={18} /></span> লগআউট</button>}
        </nav>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="mobile-bar" aria-label="মোবাইল নেভিগেশন">
        <Link href="/" className={pathname === '/' ? 'active' : ''}><span className="mb-ic"><IconHome width={20} height={20} /></span>হোম</Link>
        <Link href="/jobs" className={pathname.startsWith('/jobs') ? 'active' : ''}><span className="mb-ic"><IconBriefcase width={20} height={20} /></span>চাকরি</Link>
        <Link href="/companies" className={pathname.startsWith('/companies') ? 'active' : ''}><span className="mb-ic"><IconBuilding width={20} height={20} /></span>কোম্পানি</Link>
        <Link href="/dashboard/saved" className={pathname.startsWith('/dashboard/saved') ? 'active' : ''}><span className="mb-ic"><IconBookmark width={20} height={20} /></span>সংরক্ষিত</Link>
        <Link href="/dashboard" className={pathname.startsWith('/dashboard') ? 'active' : ''}><span className="mb-ic"><IconUser width={20} height={20} /></span>অ্যাকাউন্ট</Link>
      </nav>
    </>
  );
}
