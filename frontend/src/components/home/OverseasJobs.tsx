'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Job } from '@/types/api';
import { useLang } from '@/hooks/useLang';
import { DEMO_OVERSEAS_COUNTRIES } from '@/lib/demo-data';

export function OverseasJobs({ jobs }: { jobs: Job[] }) {
  const { t } = useLang();
  const [tab, setTab] = useState<'jobs' | 'country'>('jobs');
  if (!jobs.length) return null;

  return (
    <section className="bdj-over">
      <div className="bdj-over-h">
        <span className="bdj-over-flag" aria-label="Bangladesh Flag" />
        <h2>{t.overseasTitle === 'Overseas Jobs' ? 'বিদেশে চাকরি' : t.overseasTitle}</h2>
      </div>
      <div className="bdj-over-tabs">
        <button type="button" className={tab === 'jobs' ? 'on' : ''} onClick={() => setTab('jobs')}>{t.jobsTab}</button>
        <button type="button" className={tab === 'country' ? 'on' : ''} onClick={() => setTab('country')}>{t.countryTab}</button>
      </div>
      {tab === 'jobs' ? (
        <>
          <ul className="bdj-jobrows">
            {jobs.slice(0, 6).map((job) => (
              <li key={job.id}>
                <Link href={`/jobs/${job.slug || job.id}`}>
                  <span className="co">{job.company?.name}</span>
                  <span className="ti">{job.title}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/jobs?location=-2" className="bdj-viewall">{t.viewAll} ({jobs.length})</Link>
        </>
      ) : (
        <div className="bdj-countries">
          {DEMO_OVERSEAS_COUNTRIES.map((c) => (
            <Link key={c.name} href="/jobs?location=-2" className="bdj-country">
              <span>{c.flag}</span> {c.name} ({c.count})
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
