'use client';

import Link from 'next/link';
import { useLang } from '@/hooks/useLang';
import { formatCount } from '@/lib/format';
import type { QuickLinkCounts } from '@/types/api';

export function QuickLinks({ counts }: { counts: QuickLinkCounts & { companies?: number; contractual?: number; overseas?: number } }) {
  const { lang, t } = useLang();

  const items = [
    { href: '/companies', label: t.employerList, count: counts.companies ?? counts.verifiedCompanies },
    { href: '/jobs?sort=newest', label: t.newJobsLink, count: counts.latest },
    { href: '/jobs?sort=deadline', label: t.deadlineTomorrow, count: counts.deadlineTomorrow },
    { href: '/jobs?type=INTERNSHIP', label: t.internship, count: counts.internship, badge: true },
    { href: '/jobs?type=CONTRACT', label: t.contractual, count: counts.contractual ?? 190 },
    { href: '/jobs?type=PART_TIME', label: t.partTime, count: counts.partTime },
    { href: '/jobs?location=-2', label: t.overseas, count: counts.overseas ?? 31 },
    { href: '/jobs?type=REMOTE', label: t.wfh, count: counts.remote },
    { href: '/jobs?q=fresher', label: t.fresher, count: counts.fresher },
  ];

  return (
    <aside className="bdj-ql">
      <div className="bdj-ql-h">{t.quickLinks}</div>
      <ul>
        {items.map((item) => (
          <li key={item.href + item.label}>
            <Link href={item.href}>
              <span>
                {item.label}
                {item.badge ? <em className="bdj-new">{t.newBadge}</em> : null}
              </span>
              <span className="bdj-ql-n">({formatCount(item.count || 0, lang)})</span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
