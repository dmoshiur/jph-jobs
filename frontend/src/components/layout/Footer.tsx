'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/brand/Logo';
import { useLang } from '@/hooks/useLang';
import { IconPhone, IconPlus, IconMinus } from '@/components/ui/Icons';

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
            <div className="bdj-phones">
              {[
                { n: '16479', href: 'tel:16479' },
                { n: '09638 666 444', href: 'tel:09638666444' },
                { n: '01897 627 858', href: 'tel:01897627858' },
              ].map((p) => (
                <a key={p.n} href={p.href} className="bdj-phone">
                  <span className="bdj-phone-ic"><IconPhone width={14} height={14} /></span>
                  {p.n}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="bdj-footer-cols">
          <Accordion title={t.aboutUs} open={open === 'about'} onToggle={() => toggle('about')}>
            <Link href="/about">{t.aboutBdjobs}</Link>
            <Link href="/terms">{t.terms}</Link>
            <Link href="/privacy">{t.privacy}</Link>
            <Link href="/feedback">{t.feedback}</Link>
            <Link href="/contact">{t.contactUs}</Link>
            <Link href="/accessibility">{t.accessibility}</Link>
          </Accordion>

          <Accordion title={t.jobSeekers} open={open === 'seeker'} onToggle={() => toggle('seeker')}>
            <Link href="/bdjobs-pro">{t.bdjobsPro}</Link>
            <Link href="/dashboard">{t.myPanel}</Link>
            <Link href="/features">{t.features}</Link>
            <Link href="/video-guides">{t.videoGuides}</Link>
            <Link href="/faq">{t.faq}</Link>
          </Accordion>

          <Accordion title={t.recruiter} open={open === 'rec'} onToggle={() => toggle('rec')}>
            <Link href="/auth/register?type=employer">{t.createAccount}</Link>
            <Link href="/pricing">{t.products}</Link>
            <Link href="/employers/post-job">{t.postJob}</Link>
            <Link href="/faq">{t.faq}</Link>
          </Accordion>

          <div className="bdj-apps">
            <h4>{t.downloadSeeker}</h4>
            <p>{t.getRealtime}</p>
            <div className="bdj-badges">
              <StoreBadge store="Google Play" kicker="GET IT ON" />
              <StoreBadge store="App Store" kicker="Download on the" />
              <StoreBadge store="AppGallery" kicker="Explore it on" />
            </div>
            <h4>{t.downloadEmployer}</h4>
            <p>{t.postJobs}</p>
            <div className="bdj-badges">
              <StoreBadge store="Google Play" kicker="GET IT ON" />
              <StoreBadge store="App Store" kicker="Download on the" />
            </div>
          </div>
        </div>

        <div className="bdj-partners">
          <h2>{t.partners}</h2>
          <div className="bdj-partner-row">
            <span className="bdj-partner">Catho</span>
            <span className="bdj-partner">Workana</span>
            <span className="bdj-partner">Zhaopin</span>
          </div>
        </div>

        <div className="bdj-social-row">
          <span>{t.followUs}</span>
          <div className="bdj-socials">
            <a className="bdj-soc" href="https://www.facebook.com/mybdjobs" target="_blank" rel="noreferrer" aria-label="Facebook">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M14 8h3V4h-3c-2.8 0-5 2.2-5 5v2H6v4h3v9h4v-9h3.2l.8-4H13V9c0-.6.4-1 1-1z" /></svg>
            </a>
            <a className="bdj-soc" href="https://www.youtube.com/mybdjobs" target="_blank" rel="noreferrer" aria-label="YouTube">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23 12.2s0-3.2-.4-4.6c-.2-.9-.9-1.6-1.8-1.8C19.2 5.4 12 5.4 12 5.4s-7.2 0-8.8.4c-.9.2-1.6.9-1.8 1.8C1 9 1 12.2 1 12.2s0 3.2.4 4.6c.2.9.9 1.6 1.8 1.8 1.6.4 8.8.4 8.8.4s7.2 0 8.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.4.4-4.6.4-4.6zM9.8 15.6V8.8l6.2 3.4-6.2 3.4z" /></svg>
            </a>
            <a className="bdj-soc" href="https://www.linkedin.com/company/mybdjobs" target="_blank" rel="noreferrer" aria-label="LinkedIn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6.5 9H3.7v12h2.8V9zM5.1 3.3A1.8 1.8 0 1 0 5.1 7a1.8 1.8 0 0 0 0-3.7zM20.3 21h-2.8v-6.2c0-1.8-.8-2.4-1.8-2.4s-2 .9-2 2.5V21h-2.8V9h2.7v1.6c.6-.9 1.8-1.8 3.5-1.8 2.4 0 4.2 1.6 4.2 5.1V21z" /></svg>
            </a>
            <a className="bdj-soc" href="https://www.instagram.com/mybdjobs/" target="_blank" rel="noreferrer" aria-label="Instagram">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm10 2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm-5 3.2A3.8 3.8 0 1 1 8.2 12 3.8 3.8 0 0 1 12 8.2zm0 1.6A2.2 2.2 0 1 0 14.2 12 2.2 2.2 0 0 0 12 9.8zM17.4 6.6a.9.9 0 1 1-.9.9.9.9 0 0 1 .9-.9z" /></svg>
            </a>
          </div>
        </div>

        <div className="bdj-copy">
          <span>© {new Date().getFullYear()} jobhub.com. All rights reserved.</span>
          <span>{t.location}</span>
        </div>
      </div>
    </footer>
  );
}

function Accordion({ title, open, onToggle, children }: {
  title: string; open: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div className={`bdj-acc ${open ? 'open' : ''}`}>
      <button type="button" className="bdj-acc-h" onClick={onToggle} aria-expanded={open}>
        {title}
        <span className="bdj-acc-ic">{open ? <IconMinus width={14} height={14} /> : <IconPlus width={14} height={14} />}</span>
      </button>
      <div className="bdj-acc-b">{children}</div>
    </div>
  );
}

function StoreBadge({ store, kicker }: { store: string; kicker: string }) {
  return (
    <span className="bdj-store">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M8 3h8l1 4H7l1-4zm-2 6h12l-1.2 12.2A2 2 0 0 1 14.8 23H9.2a2 2 0 0 1-2-1.8L6 9z" />
      </svg>
      <span>
        <span className="st-k">{kicker}</span>
        <span className="st-v">{store}</span>
      </span>
    </span>
  );
}
