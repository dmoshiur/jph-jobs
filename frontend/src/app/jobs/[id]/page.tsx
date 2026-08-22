'use client';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import type { Job } from '@/types/api';

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [job, setJob] = useState<Job | null>(null);
  const [id, setId] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => { void params.then((p) => setId(p.id)); }, [params]);
  useEffect(() => { if (id) void api.get<Job>(`/jobs/${id}`).then(setJob); }, [id]);

  async function apply() {
    try { await api.post('/applications', { jobId: id }); setMessage('Application submitted.'); }
    catch (err) { setMessage(err instanceof Error ? err.message : 'Could not apply'); }
  }

  if (!job) return <main className="container section"><p>Loading job...</p></main>;
  const structuredData = { '@context': 'https://schema.org', '@type': 'JobPosting', title: job.title, hiringOrganization: { '@type': 'Organization', name: job.company?.name }, jobLocation: { '@type': 'Place', address: job.district?.name }, validThrough: job.deadline };
  return <main className="container section"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /><span className="badge">{job.type}</span><h1>{job.title}</h1><p>{job.company?.name} · {job.district?.name}</p><div className="panel"><h2>Requirements</h2><p>{(job as any).requirements}</p><h2>Responsibilities</h2><p>{(job as any).responsibilities}</p><button onClick={() => void apply()}>Apply securely</button>{message && <p className={message.includes('submitted') ? 'success' : 'error'}>{message}</p>}</div></main>;
}
