'use client';
import { useEffect, useState } from 'react';
import { JobCard } from '@/components/JobCard';
import { api } from '@/services/api';
import type { Job, Paginated } from '@/types/api';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load(search = '') {
    setLoading(true); setError('');
    try {
      const data = await api.get<Paginated<Job>>(`/jobs${search ? `?q=${encodeURIComponent(search)}` : ''}`);
      setJobs(data.items);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load jobs'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  return <main className="container section"><h1>Find local jobs</h1><form className="search-row" onSubmit={(e) => { e.preventDefault(); void load(q); }}><input placeholder="Search title, skill or company" value={q} onChange={(e) => setQ(e.target.value)} /><button>Search</button></form>{loading ? <p>Loading jobs...</p> : error ? <p className="error">{error}</p> : <div className="grid two" style={{ marginTop: 24 }}>{jobs.map((job) => <JobCard key={job.id} job={job} />)}</div>}</main>;
}
