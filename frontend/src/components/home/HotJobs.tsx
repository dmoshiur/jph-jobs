import Link from 'next/link';
import type { Company, Job } from '@/types/api';
import { initials, logoColor } from '@/lib/format';

export function HotJobs({ jobs }: { jobs: Job[] }) {
  const groups = new Map<string, { company: Company; jobs: Job[] }>();
  for (const job of jobs) {
    const key = job.company?.id || job.company?.name || job.id;
    if (!job.company) continue;
    const cur = groups.get(key);
    if (cur) cur.jobs.push(job);
    else groups.set(key, { company: job.company, jobs: [job] });
  }
  const cards = Array.from(groups.values()).slice(0, 10);
  if (!cards.length) return null;

  return (
    <section className="container bdj-hot-sec">
      <div className="sec-head">
        <div>
          <h2>Hot Jobs</h2>
          <p className="sub">Featured employers hiring now</p>
        </div>
        <Link href="/jobs?featured=true">View All</Link>
      </div>
      <div className="bdj-hot-grid">
        {cards.map(({ company, jobs: list }) => (
          <article key={company.id} className="bdj-hot-card">
            <div className="bdj-hot-logo" style={{ background: logoColor(company.name) }}>
              {initials(company.name)}
            </div>
            <h3>
              <Link href={`/companies/${company.slug || company.id}`}>{company.name}</Link>
            </h3>
            <ul>
              {list.slice(0, 3).map((j) => (
                <li key={j.id}>
                  <Link href={`/jobs/${j.slug || j.id}`}>{j.title}</Link>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
