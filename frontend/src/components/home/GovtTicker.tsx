'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Job } from '@/types/api';
import { useLang } from '@/hooks/useLang';

export function GovtTicker({ jobs }: { jobs: Job[] }) {
  const { t } = useLang();
  const [paused, setPaused] = useState(false);
  if (!jobs.length) return null;
  const loop = [...jobs, ...jobs];

  return (
    <section className="bdj-govt">
      <div className="bdj-govt-h">
        <h2>{t.govtJobs}</h2>
        <button type="button" className="bdj-pause" onClick={() => setPaused((v) => !v)} aria-label={paused ? 'Play' : 'Pause'}>
          {paused ? '▶' : '❚❚'}
        </button>
      </div>
      <div className={`bdj-ticker ${paused ? 'paused' : ''}`}>
        <div className="bdj-ticker-track">
          {loop.map((job, i) => (
            <Link key={`${job.id}-${i}`} href={`/jobs/${job.slug || job.id}`} className="bdj-ticker-item">
              <strong>{job.company?.name || 'Government'}</strong>
              <span>{job.title}</span>
            </Link>
          ))}
        </div>
      </div>
      <Link href="/jobs?type=govt" className="bdj-viewall">
        {t.viewAll} ({jobs.length})
      </Link>
    </section>
  );
}
