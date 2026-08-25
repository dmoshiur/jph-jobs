'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/brand/Logo';
import { useLang } from '@/hooks/useLang';
import { IconPhone, IconPlus, IconMinus } from '@/components/ui/Icons';

const ABOUT_HREFS = ['/about', '/terms', '/privacy', '/feedback', '/contact', '/accessibility'];
const SEEKER_HREFS = ['/bdjobs-pro', '/my-panel', '/features', '/video-guides', '/faq'];
const REC_HREFS = ['/recruiter/register', '/products', '/post-job', '/faq'];

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
        {/* Footer Top - Exact bdjobs.com structure */}
        <div className="bdj-footer-top">
          <div className="bdj-footer-brand">
            <Logo light />
            <h3>{t.needSupport || 'Need any support?'}</h3>
            <p>{t.contactHours || 'Our Contact Centre is available from'}<br />{t.hours || '-9 am to 8 pm (Sat to Thurs).'}</p>
            <div className="bdj-phones">
              {[
                { n: '16479', href: 'tel:16479' },
                { n: '09638 666 444', href: 'tel:09638666444' },
                { n: '01897 627 858', href: 'tel:01897627858' },
              ].map((p) => (
                <a key={p.n} href={p.href} className="bdj-phone">
                  <span className="bdj-phone-ic"><IconPhone width={16} height={16} /></span>
                  {p.n}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Columns - Exact bdjobs.com */}
        <div className="bdj-footer-cols">
          {/* About Us */}
          <Accordion title={t.aboutUs || 'About Us'} open={open === 'about'} onToggle={() => toggle('about')}>
            {[
              { label: t.aboutBdjobs || 'About Bdjobs.com', href: '/about' },
              { label: t.terms || 'Terms & Conditions', href: '/terms' },
              { label: t.privacy || 'Privacy Policy', href: '/privacy' },
              { label: t.feedback || 'Feedback', href: '/feedback' },
              { label: t.contactUs || 'Contact Us', href: '/contact' },
              { label: t.accessibility || 'Accessibility Statement', href: '/accessibility' },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </Accordion>

          {/* Job Seekers */}
          <Accordion title={t.jobSeekers || 'Job Seekers'} open={open === 'seeker'} onToggle={() => toggle('seeker')}>
            {[
              { label: t.bdjobsPro || 'Bdjobs Pro', href: '/bdjobs-pro' },
              { label: t.myPanel || 'My Bdjobs Panel', href: '/my-panel' },
              { label: t.features || 'List of Features', href: '/features' },
              { label: t.videoGuides || 'Video Guides', href: '/video-guides' },
              { label: t.faq || 'FAQ', href: '/faq' },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </Accordion>

          {/* Recruiter */}
          <Accordion title={t.recruiter || 'Recruiter'} open={open === 'rec'} onToggle={() => toggle('rec')}>
            {[
              { label: t.createAccount || 'Create Account', href: '/recruiter/register' },
              { label: t.products || 'Products/Service', href: '/products' },
              { label: t.postJob || 'Post a Job', href: '/post-job' },
              { label: t.faq || 'FAQ', href: '/recruiter/faq' },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </Accordion>

          {/* Mobile Apps Section */}
          <div className="bdj-apps">
            <h4>{t.downloadSeeker || 'Download Job Seeker App'}</h4>
            <p>{t.getRealtime || 'Get real-time job updates on our app.'}</p>
            <div className="bdj-badges">
              <StoreBadge 
                kind="play" 
                label="Google Play" 
                href="https://play.google.com/store/apps/details?id=com.bdjobs.app"
              />
              <StoreBadge 
                kind="ios" 
                label="App Store" 
                href="https://apps.apple.com/in/app/bdjobs/id1435728822"
              />
              <StoreBadge 
                kind="huawei" 
                label="AppGallery" 
                href="https://appgallery.huawei.com/#/app/C101426113"
              />
            </div>

            <h4 style={{ marginTop: 18 }}>{t.downloadEmployer || 'Download Employer App'}</h4>
            <p>{t.postJobs || 'Post jobs and manage hiring anytime.'}</p>
            <div className="bdj-badges">
              <StoreBadge 
                kind="play" 
                label="Google Play" 
                href="https://play.google.com/store/apps/details?id=com.bdjobs.recruiter"
              />
              <StoreBadge 
                kind="ios" 
                label="App Store" 
                href="https://apps.apple.com/us/app/bdjobs-employer/id1479828492"
              />
            </div>
          </div>
        </div>

        {/* Partners Section */}
        <div className="bdj-partners">
          <h2>{t.partners || 'Our Valuable Partners'}</h2>
          <div className="bdj-partner-row">
            <span className="bdj-partner">Catho</span>
            <span className="bdj-partner">Workana</span>
            <span className="bdj-partner">Zhaopin</span>
          </div>
        </div>

        {/* Social Media Row */}
        <div className="bdj-social-row">
          <span>{t.followUs || 'Follow Us'}</span>
          <div className="bdj-socials">
            <Social kind="fb" label="Facebook" />
            <Social kind="yt" label="YouTube" />
            <Social kind="in" label="LinkedIn" />
          </div>
        </div>

        {/* Copyright */}
        <div className="bdj-copy">
          <span>© {new Date().getFullYear()} {t.siteName || 'jobhub'}. All rights reserved.</span>
          <span>{t.location || 'Bangladesh'}</span>
        </div>
      </div>
    </footer>
  );
}

function Accordion({ title, open, onToggle, children }: { 
  title: string; 
  open: boolean; 
  onToggle: () => void; 
  children: React.ReactNode 
}) {
  return (
    <div className={`bdj-acc ${open ? 'open' : ''}`}>
      <button type="button" className="bdj-acc-h" onClick={onToggle} aria-expanded={open}>
        {title}
        <span className="bdj-acc-ic">
          {open ? <IconMinus width={14} height={14} /> : <IconPlus width={14} height={14} />}
        </span>
      </button>
      <div className="bdj-acc-b">{children}</div>
    </div>
  );
}

function StoreBadge({ kind, label, href }: { kind: 'play' | 'ios' | 'huawei'; label: string; href: string }) {
  return (
    <a href={href} className="bdj-store" target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  );
}

function Social({ kind, label }: { kind: 'fb' | 'yt' | 'in'; label: string }) {
  return (
    <a href={`https://${kind === 'fb' ? 'facebook.com' : kind === 'yt' ? 'youtube.com' : 'linkedin.com'}/bdjobs`} 
       className={`bdj-soc bdj-soc-${kind}`} 
       aria-label={label}
       target="_blank" 
       rel="noopener noreferrer"
    />
  );
}
