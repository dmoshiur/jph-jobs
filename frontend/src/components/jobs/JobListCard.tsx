'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Job } from '@/types/api';
import { deadlineLabel, formatSalary, initials, logoColor } from '@/lib/format';
import { IconLocation, IconClock, IconBriefcase, IconMoney, IconHeart } from '@/components/ui/Icons';
import { useLang } from '@/hooks/useLang';
import { api } from '@/services/api';
import { useToast } from '@/components/ui/Toast';

export function JobListCard({ job }: { job: Job }) {
  const { lang } = useLang();
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();
  const featured = job.tier === 'FEATURED';
  const hot = job.tier === 'HOT';
  const location = [job.upazila?.name, job.district?.name].filter(Boolean).join(', ') || 'Bangladesh';
  const color = logoColor(job.company?.name ?? 'J');

  async function toggleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (saved) { await api.delete(`/jobs/${job.id}/save`); setSaved(false); }
      else { await api.post(`/jobs/${job.id}/save`); setSaved(true); toast('Job saved', 'success'); }
    } catch {
      toast('Please sign in to save jobs', 'error');
    }
  }

  return (
    <article className={`bdj-list-card ${featured ? 'is-feat' : ''} ${hot ? 'is-hot' : ''}`}>
      <div className="bdj-list-logo" style={{ background: color }}>
        {job.company?.logoObjectKey
          ? <img src={job.company.logoObjectKey} alt="" />
          : initials(job.company?.name ?? 'J')}
      </div>
      <div>
        <h3 className="bdj-list-title">
          <Link href={`/jobs/${job.slug || job.id}`}>{job.title}</Link>
        </h3>
        <div className="bdj-list-co">
          <Link href={`/companies/${job.company?.slug || job.company?.id}`}>{job.company?.name ?? 'Company'}</Link>
        </div>
        <div className="bdj-list-meta">
          <span><IconLocation width={13} height={13} /> {location}</span>
          {job.deadline && (
            <span className={new Date(job.deadline).getTime() - Date.now() < 2 * 86400000 ? 'deadline-warn' : ''}>
              <IconClock width={13} height={13} /> Deadline {deadlineLabel(job.deadline, lang)}
            </span>
          )}
          {job.experience && <span><IconBriefcase width={13} height={13} /> Experience {job.experience}</span>}
          <span><IconMoney width={13} height={13} /> {formatSalary(job, lang)}</span>
        </div>
      </div>
      <div className="bdj-list-side">
        <button type="button" className={`bdj-heart ${saved ? 'on' : ''}`} onClick={toggleSave} aria-label="Save job">
          <IconHeart width={16} height={16} fill={saved ? 'currentColor' : 'none'} />
        </button>
        {hot && <span className="bdj-hot-badge">Hot</span>}
        {featured && !hot && <span className="bdj-feat-badge">Featured</span>}
      </div>
    </article>
  );
}
