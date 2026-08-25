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
  const location = [job.upazila?.name, job.district?.name].filter(Boolean).join(', ') || job.location || 'Bangladesh';

  async function toggleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setSaving(true);
    try {
      if (saved) { 
        await api.delete(`/jobs/${job.id}/save`); 
        setSaved(false); 
        toast('Saved job removed'); 
      }
      else { 
        await api.post(`/jobs/${job.id}/save`); 
        setSaved(true); 
        toast('Job saved successfully', 'success'); 
      }
    } catch {
      toast('Please login first', 'error');
    } finally { 
      setSaving(false); 
    }
  }

  return (
    <article className={`job-card ${featured ? 'featured' : ''} ${hot ? 'hot' : ''}`}>
      <div className="job-top">
        {/* Company Logo */}
        <div className="job-logo">
          {job.company?.logoObjectKey ? (
            <img src={job.company.logoObjectKey} alt={job.company?.name || 'Company Logo'} />
          ) : (
            initials(job.company?.name ?? 'J')
          )}
        </div>
        
        {/* Job Main Content */}
        <div className="job-main">
          <h3 className="job-title">
            <Link href={`/jobs/${job.slug || job.id}`}>
              {job.title}
            </Link>
          </h3>
          <div className="job-company">
            <Link href={`/companies/${job.company?.slug || job.company?.id}`}>
              {job.company?.name ?? 'Company'}
            </Link>
            {job.company?.verificationStatus === 'VERIFIED' && (
              <span className="badge badge-verified" style={{ fontSize: '.68rem', padding: '1px 7px' }}>Verified</span>
            )}
          </div>
        </div>

        {/* Badges - Right side */}
        <div className="job-badges">
          {hot && <span className="badge badge-hot">HOT</span>}
          {featured && !hot && <span className="badge badge-featured">FEATURED</span>}
          {job.tier === 'PREMIUM' && <span className="badge badge-blue">PREMIUM</span>}
        </div>
      </div>

      {/* Job Meta Information */}
      {!compact && (
        <div className="job-meta">
          <span><IconLocation width={14} height={14} /> {location}</span>
          {job.deadline && (
            <span className={new Date(job.deadline).getTime() - Date.now() < 2 * 86400000 ? 'deadline-warn' : ''}>
              <IconClock width={13} height={13} /> {deadlineLabel(job.deadline)}
            </span>
          )}
          {job.experience && <span><IconBriefcase width={14} height={14} /> {job.experience}</span>}
          {job.salary && <span><IconMoney width={14} height={14} /> {formatSalary(job)}</span>}
        </div>
      )}

      {/* Job Footer */}
      <div className="job-foot">
        <span className="job-date">
          <IconClock width={13} height={13} style={{ display: 'inline', verticalAlign: -2, marginRight: 4 }} />
          {timeAgo(job.publishedAt || job.createdAt)}
        </span>
        <div className="job-actions">
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={toggleSave} 
            disabled={saving}
            aria-label={saved ? 'Remove from saved' : 'Save job'}
            aria-pressed={saved}
            style={{ color: saved ? 'var(--bdj-blue)' : undefined }}
          >
            <IconBookmark width={15} height={15} fill={saved ? 'currentColor' : 'none'} />
          </button>
          <Link href={`/jobs/${job.slug || job.id}`} className="btn btn-sm btn-outline">
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}
