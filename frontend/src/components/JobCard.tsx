'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Job } from '@/types/api';
import { formatSalary, timeAgo, deadlineLabel, initials, jobTypeLabel } from '@/lib/format';
import { IconLocation, IconMoney, IconClock, IconBookmark, IconBriefcase, IconGraduation, IconFlame } from '@/components/ui/Icons';
import { api } from '@/services/api';
import { useToast } from '@/components/ui/Toast';

export function JobCard({ job, compact = false }: { job: Job; compact?: boolean }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const featured = job.tier === 'FEATURED' || job.tier === 'HOT';
  const hot = job.tier === 'HOT';
  const location = [job.upazila?.name, job.district?.name].filter(Boolean).join(', ') || 'বগুড়া/জয়পুরহাট';

  async function toggleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setSaving(true);
    try {
      if (saved) { await api.delete(`/jobs/${job.id}/save`); setSaved(false); toast('সংরক্ষণ থেকে সরানো হয়েছে'); }
      else { await api.post(`/jobs/${job.id}/save`); setSaved(true); toast('চাকরি সংরক্ষিত হয়েছে', 'success'); }
    } catch {
      toast('লগইন করুন', 'error');
    } finally { setSaving(false); }
  }

  return (
    <article className={`job-card ${featured ? 'featured' : ''} ${hot ? 'hot' : ''}`}>
      <div className="job-badges">
        {hot && <span className="badge badge-hot"><IconFlame width={11} height={11} /> জরুরি</span>}
        {featured && !hot && <span className="badge badge-featured">ফিচার্ড</span>}
        <span className="badge badge-blue">{jobTypeLabel(job.type)}</span>
      </div>
      <div className="job-top">
        <div className="job-logo">{job.company?.logoObjectKey ? <img src={job.company.logoObjectKey} alt="" /> : initials(job.company?.name ?? 'J')}</div>
        <div className="job-main">
          <h3 className="job-title"><Link href={`/jobs/${job.slug || job.id}`}>{job.title}</Link></h3>
          <div className="job-company">
            <Link href={`/companies/${job.company?.slug || job.company?.id}`}>{job.company?.name ?? 'কোম্পানি'}</Link>
            {job.company?.verificationStatus === 'VERIFIED' && <span className="badge badge-verified" style={{ fontSize: '.68rem', padding: '1px 7px' }}>ভেরিফাইড</span>}
          </div>
        </div>
      </div>

      {!compact && (
        <div className="job-meta">
          <span><span className="ic"><IconLocation width={14} height={14} /></span> {location}</span>
          <span><span className="ic"><IconMoney width={14} height={14} /></span> {formatSalary(job)}</span>
          {job.experience && <span><span className="ic"><IconBriefcase width={14} height={14} /></span> {job.experience}</span>}
          {job.education && <span><span className="ic"><IconGraduation width={14} height={14} /></span> {job.education}</span>}
        </div>
      )}

      <div className="job-foot">
        <span className={`job-date ${new Date(job.deadline).getTime() - Date.now() < 2 * 86400000 ? 'deadline-warn' : ''}`}>
          <IconClock width={13} height={13} style={{ display: 'inline', verticalAlign: -2, marginRight: 4 }} />
          {deadlineLabel(job.deadline)} · {timeAgo(job.publishedAt || job.createdAt)}
        </span>
        <div className="job-actions">
          <button className="btn btn-secondary btn-sm" onClick={toggleSave} disabled={saving} aria-label={saved ? 'সংরক্ষণ সরান' : 'সংরক্ষণ করুন'} aria-pressed={saved} style={{ color: saved ? 'var(--danger-500)' : undefined }}>
            <IconBookmark width={15} height={15} fill={saved ? 'currentColor' : 'none'} />
          </button>
          <Link href={`/jobs/${job.slug || job.id}`} className="btn btn-sm">বিস্তারিত দেখুন</Link>
        </div>
      </div>
    </article>
  );
}
