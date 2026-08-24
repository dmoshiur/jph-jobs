'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/brand/Logo';
import { useLang } from '@/hooks/useLang';
import { IconPhone, IconPlus } from '@/components/ui/Icons';

const ABOUT_HREFS = ['/about', '/terms', '/privacy', '/contact', '/contact', '/help'];
const SEEKER_HREFS = ['/dashboard', '/dashboard/saved', '/dashboard/cv', '/dashboard/alerts', '/help'];
const REC_HREFS = ['/auth/register', '/employers/post-job', '/auth/register?type=shop-owner', '/help'];

export function Footer() {
  const pathname = usePathname();
  const { t } = useLang();
  const [open, setOpen] = useState<string>('about');
  if (pathname.startsWith('/admin')) return null;

  function toggle(id: string) {
    setOpen((cur) => (cur === id ? '' : id));
  }

  return (
    <footer className="bdj-footer">
      <div className="container">
        <div className="bdj-footer-top">
          <div className="bdj-footer-brand">
            <Logo light />
            <h3>{t.needSupport}</h3>
            <p>{t.contactHours}<br />{t.hours}</p>
          </div>
          <div className="bdj-phones">
            {[
              { n: '16479', href: 'tel:16479' },
              { n: '09638 666 444', href: 'tel:09638666444' },
              { n: '01897 627 858', href: 'tel:01897627858' }
            ].map((p) => (
              <a key={p.n} href={p.href} className="bdj-phone">
                <span className="bdj-phone-ic"><IconPhone width={16} height={16} /></span>
                {p.n}
              </a>
            ))}
          </div>
        </div>

        <div className="bdj-footer-cols">
          <Accordion title={t.aboutUs} open={open === 'about'} onToggle={() => toggle('about')}>
            {t.aboutLinks.map((label, i) => <Link key={label} href={ABOUT_HREFS[i]}>{label}</Link>)}
          </Accordion>
          <Accordion title={t.jobSeekers} open={open === 'seeker'} onToggle={() => toggle('seeker')}>
            {t.seekerLinks.map((label, i) => <Link key={label} href={SEEKER_HREFS[i]}>{label}</Link>)}
          </Accordion>
          <Accordion title={t.recruiter} open={open === 'rec'} onToggle={() => toggle('rec')}>
            {t.recruiterLinks.map((label, i) => <Link key={label} href={REC_HREFS[i]}>{label}</Link>)}
          </Accordion>

          <div className="bdj-apps">
            <h4>{t.downloadSeeker}</h4>
            <p>{t.downloadSeekerSub}</p>
            <div className="bdj-badges">
              <StoreBadge kind="play" />
              <StoreBadge kind="ios" />
              <StoreBadge kind="huawei" />
            </div>
            <h4 style={{ marginTop: 18 }}>{t.downloadEmployer}</h4>
            <p>{t.downloadEmployerSub}</p>
            <div className="bdj-badges">
              <StoreBadge kind="play" />
              <StoreBadge kind="ios" />
            </div>
          </div>
        </div>

        <div className="bdj-social-row">
          <span>{t.stayConnected}</span>
          <div className="bdj-socials">
            <Social kind="ig" />
            <Social kind="fb" />
            <Social kind="in" />
            <Social kind="yt" />
          </div>
        </div>

        <div className="bdj-copy">
          <span>© {new Date().getFullYear()} jobhub. All rights reserved.</span>
          <span>Bogura · Joypurhat · Bangladesh</span>
        </div>
      </div>
    </footer>
  );
}

function Accordion({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className={`bdj-acc ${open ? 'open' : ''}`}>
      <button type="button" className="bdj-acc-h" onClick={onToggle} aria-expanded={open}>
        {title}
        <span className="bdj-acc-ic"><IconPlus width={14} height={14} /></span>
      </button>
      <div className="bdj-acc-b">{children}</div>
    </div>
  );
}

function StoreBadge({ kind }: { kind: 'play' | 'ios' | 'huawei' }) {
  const label = kind === 'play' ? 'GET IT ON Google Play' : kind === 'ios' ? 'Download on the App Store' : 'Explore it on AppGallery';
  return <span className={`bdj-store bdj-store-${kind}`}>{label}</span>;
}

function Social({ kind }: { kind: 'ig' | 'fb' | 'in' | 'yt' }) {
  return <span className={`bdj-soc bdj-soc-${kind}`} aria-hidden />;
}
