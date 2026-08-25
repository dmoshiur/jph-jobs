'use client';

import Link from 'next/link';
import { useLang } from '@/hooks/useLang';
import type { QuickLinkCounts } from '@/types/api';

export function QuickLinks({ counts }: { counts: QuickLinkCounts & { companies?: number } }) {
  const { t } = useLang();
  
  // Exact bdjobs.com Quick Links structure
  const items = [
    {
      href: '/companies',
      label: t.employerList || 'Employer List',
      count: counts.companies ?? counts.verifiedCompanies,
    },
    {
      href: '/jobs?sort=newest',
      label: t.newJobsLink || 'New Jobs',
      count: counts.latest,
    },
    {
      href: '/jobs?sort=deadline',
      label: t.deadlineTomorrow || 'Deadline Tomorrow',
      count: counts.deadlineTomorrow,
    },
    {
      href: '/jobs?type=INTERNSHIP',
      label: t.internship || 'Internship Opportunity',
      count: counts.internship,
      badge: true,
    },
    {
      href: '/jobs?type=CONTRACT',
      label: t.contractual || 'Contractual Jobs',
      count: 0,
    },
    {
      href: '/jobs?type=PART_TIME',
      label: t.partTime || 'Part time Jobs',
      count: counts.partTime,
    },
    {
      href: '/jobs?location=-2',
      label: t.overseas || 'Overseas Jobs',
      count: 0,
    },
    {
      href: '/jobs?type=REMOTE',
      label: t.wfh || 'Work From Home',
      count: counts.remote,
    },
    {
      href: '/jobs?q=fresher',
      label: t.fresher || 'Fresher Jobs',
      count: counts.fresher,
    },
  ];

  return (
    <aside className="bdj-ql">
      <div className="bdj-ql-h">{t.quickLinks || 'QUICK LINKS'}</div>
      <ul>
        {items.map((item) => (
          <li key={item.href + item.label}>
            <Link href={item.href}>
              <span>
                {item.label}
                {item.badge ? <em className="bdj-new">{t.newBadge || 'new'}</em> : null}
              </span>
              <span className="bdj-ql-n">({item.count})</span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
