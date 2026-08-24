'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLang } from '@/hooks/useLang';
import { Logo } from '@/components/brand/Logo';
import {
  IconBell, IconMenu, IconX, IconBriefcase, IconBuilding, IconStore,
  IconBookmark, IconUser, IconPlus, IconGraduation, IconLogout, IconCog, IconSearch, IconPhone
} from '@/components/ui/Icons';

export function Header() {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLang();
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => { setDrawerOpen(false); setContactOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  if (pathname.startsWith('/admin')) return null;

  const isAdmin = user?.roles?.some((r) => ['root-admin', 'super-admin'].includes(r));
  const canPost = user?.roles?.some((r) => ['employer', 'shop-owner', 'super-admin', 'root-admin'].includes(r));

  return (
    <>
      <header className="bdj-header">
        <div className="container bdj-header-inner">
          <Logo />

          <nav className="bdj-util" aria-label="Utility">
            <Link href="/training" className="bdj-util-link">{t.elearning}</Link>
            <span className="bdj-vbar" aria-hidden />
            <Link href="/resources" className="bdj-util-link">{t.tender}</Link>
            <span className="bdj-vbar" aria-hidden />
            <Link href="/dashboard/employer" className="bdj-util-link">{t.recruiter}</Link>
            <span className="bdj-vbar" aria-hidden />
            <Link href={user && canPost ? '/dashboard/employer/jobs/new' : '/employers/post-job'} className="bdj-util-link bdj-util-strong">
              {t.postJob}
            </Link>
          </nav>

          <div className="bdj-header-actions">
            <div className="bdj-lang" role="group" aria-label="Language">
              <button type="button" className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>ENG</button>
              <button type="button" className={lang === 'bn' ? 'on' : ''} onClick={() => setLang('bn')}>বাংলা</button>
            </div>

            <div className="bdj-contact-wrap">
              <button type="button" className="bdj-icon-btn" aria-label={t.contactUs} onClick={() => setContactOpen((v) => !v)}>
                <IconPhone width={18} height={18} />
              </button>
              {contactOpen && (
                <div className="bdj-contact-pop">
                  <strong>{t.contactUs}</strong>
                  <p>{t.contactHours}<br />{t.hours}</p>
                  <a href="tel:16479">16479</a>
                  <a href="tel:09638666444">09638 666 444</a>
                  <a href="tel:01897627858">01897 627 858</a>
                  <Link href="/contact">{t.contactUs}</Link>
                </div>
              )}
            </div>

            {!user && (
              <>
                <Link href="/auth/login" className="bdj-text-link desktop-only">{t.signIn}</Link>
                <Link href="/auth/register" className="bdj-signin desktop-only">{t.signUp}</Link>
              </>
            )}
            {user && (
              <>
                <Link href="/dashboard" className="bdj-icon-btn desktop-only" aria-label={t.dashboard}>
                  <IconUser width={18} height={18} />
                </Link>
                <Link href="/notifications" className="bdj-icon-btn desktop-only" aria-label="Notifications">
                  <IconBell width={18} height={18} />
                </Link>
              </>
            )}

            <button type="button" className="bdj-icon-btn mobile-only" aria-label={t.menu} onClick={() => setDrawerOpen(true)}>
              <IconMenu width={22} height={22} />
            </button>
          </div>
        </div>
      </header>

      <div className={`drawer-backdrop ${drawerOpen ? 'open' : ''}`} onClick={() => setDrawerOpen(false)} />
      <aside className={`drawer ${drawerOpen ? 'open' : ''}`} aria-hidden={!drawerOpen}>
        <div className="drawer-h">
          <Logo compact />
          <button className="bdj-icon-btn" aria-label="Close" onClick={() => setDrawerOpen(false)}><IconX width={20} height={20} /></button>
        </div>
        <nav className="drawer-nav">
          <div className="drawer-section">{t.search}</div>
          <Link href="/jobs"><span className="ic"><IconSearch width={18} height={18} /></span> {t.jobs}</Link>
          <Link href="/companies"><span className="ic"><IconBuilding width={18} height={18} /></span> {t.companiesNav}</Link>
          <Link href="/businesses"><span className="ic"><IconStore width={18} height={18} /></span> {t.businesses}</Link>
          <Link href="/training"><span className="ic"><IconGraduation width={18} height={18} /></span> {t.elearning}</Link>
          <Link href="/resources"><span className="ic"><IconBriefcase width={18} height={18} /></span> {t.tender}</Link>

          <div className="drawer-section">{t.jobSeekers}</div>
          {user ? (
            <>
              <Link href="/dashboard"><span className="ic"><IconUser width={18} height={18} /></span> {t.dashboard}</Link>
              <Link href="/dashboard/saved"><span className="ic"><IconBookmark width={18} height={18} /></span> Saved</Link>
            </>
          ) : (
            <>
              <Link href="/auth/login"><span className="ic"><IconUser width={18} height={18} /></span> {t.signIn}</Link>
              <Link href="/auth/register"><span className="ic"><IconPlus width={18} height={18} /></span> {t.signUp}</Link>
            </>
          )}

          <div className="drawer-section">{t.recruiter}</div>
          <Link href="/employers/post-job"><span className="ic"><IconPlus width={18} height={18} /></span> {t.postJob}</Link>
          <Link href="/dashboard/employer"><span className="ic"><IconBriefcase width={18} height={18} /></span> {t.recruiter}</Link>
          {isAdmin && <Link href="/admin"><span className="ic"><IconCog width={18} height={18} /></span> Admin</Link>}
          {user && (
            <button type="button" onClick={() => { void logout(); router.push('/'); }}>
              <span className="ic"><IconLogout width={18} height={18} /></span> {t.logout}
            </button>
          )}
        </nav>
      </aside>
    </>
  );
}
