import Link from 'next/link';
import type { QuickLinkCounts } from '@/types/api';
import { toBn } from '@/lib/format';
import { IconChevronRight, IconFlame, IconClock, IconGraduation, IconBriefcase, IconGlobe, IconStar, IconBuilding, IconCheck } from '@/components/ui/Icons';

const LINKS: { key: keyof QuickLinkCounts; label: string; href: string; icon: React.ReactNode }[] = [
  { key: 'latest', label: 'সর্বশেষ চাকরি', href: '/jobs?sort=newest', icon: <IconClock width={16} height={16} /> },
  { key: 'deadlineTomorrow', label: 'আগামীকাল শেষ', href: '/jobs?sort=deadline', icon: <IconClock width={16} height={16} /> },
  { key: 'internship', label: 'ইন্টার্নশিপ', href: '/jobs?type=INTERNSHIP', icon: <IconGraduation width={16} height={16} /> },
  { key: 'partTime', label: 'পার্ট-টাইম চাকরি', href: '/jobs?type=PART_TIME', icon: <IconBriefcase width={16} height={16} /> },
  { key: 'remote', label: 'রিমোট/ওয়ার্ক ফ্রম হোম', href: '/jobs?type=REMOTE', icon: <IconGlobe width={16} height={16} /> },
  { key: 'fresher', label: 'ফ্রেশার চাকরি', href: '/jobs?q=fresher', icon: <IconStar width={16} height={16} /> },
  { key: 'urgent', label: 'জরুরি নিয়োগ', href: '/jobs?hot=true', icon: <IconFlame width={16} height={16} /> },
  { key: 'verifiedCompanies', label: 'ভেরিফাইড কোম্পানি', href: '/companies?verified=true', icon: <IconCheck width={16} height={16} /> }
];

export function QuickLinks({ counts }: { counts: QuickLinkCounts }) {
  return (
    <div className="panel">
      <div className="panel-h"><h3>🔗 দ্রুত লিংক</h3></div>
      <ul className="ql-list">
        {LINKS.map((l) => (
          <li key={l.key}>
            <Link href={l.href}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--primary-500)' }}>{l.icon}</span> {l.label}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span className="ql-cnt">{toBn(counts[l.key] ?? 0)}</span>
                <span className="ql-arr"><IconChevronRight width={14} height={14} /></span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
