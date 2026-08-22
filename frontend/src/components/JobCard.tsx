import Link from 'next/link';
import type { Job } from '@/types/api';

export function JobCard({ job }: { job: Job }) {
  return (
    <article className="card">
      <div className="card-title">
        <div>
          <Link href={`/jobs/${job.id}`}><h3>{job.title}</h3></Link>
          <p>{job.company?.name ?? 'Company'} · {job.district?.name ?? 'Bangladesh'}</p>
        </div>
        <span className="badge">{job.type.replaceAll('_', ' ')}</span>
      </div>
      <p>{job.salaryText || 'Salary negotiable'} · Deadline {new Date(job.deadline).toLocaleDateString()}</p>
      <Link className="button secondary" href={`/jobs/${job.id}`}>View job</Link>
    </article>
  );
}
