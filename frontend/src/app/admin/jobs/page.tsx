'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DataTable } from '@/components/admin/DataTable';
import { api } from '@/services/api';
import { timeAgo } from '@/lib/format';

interface Row { id: string; title: string; status: string; createdAt: string; company?: { name: string }; creator?: { name: string }; deadline: string }

export default function AdminJobs() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const qs = new URLSearchParams({ page: String(page), limit: '20', ...(q ? { q } : {}), ...(status ? { status } : {}) });
    api.get<{ items: Row[]; total: number }>(`/admin/jobs?${qs}`).then((d) => { setRows(d.items); setTotal(d.total); }).catch(() => undefined);
  }, [page, q, status]);

  async function setJobStatus(id: string, s: string) {
    await api.patch(`/admin/jobs/${id}/status`, { status: s });
    setRows((r) => r.map((j) => j.id === id ? { ...j, status: s } : j));
  }

  return (
    <DataTable<Row>
      title="চাকরি ব্যবস্থাপনা"
      search={q} onSearch={setQ}
      actions={<select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 'auto', padding: '7px 10px' }}><option value="">সব স্ট্যাটাস</option>{['PENDING_REVIEW','APPROVED','PUBLISHED','REJECTED','CLOSED','EXPIRED'].map((s) => <option key={s} value={s}>{s}</option>)}</select>}
      rows={rows} total={total} page={page} pages={Math.ceil(total / 20)} onPage={setPage}
      columns={[
        { key: 'title', header: 'পদ', render: (j) => <><Link href={`/jobs/${j.id}`} style={{ color: 'var(--primary-700)', fontWeight: 600 }}>{j.title}</Link><div className="text-xs muted">{j.company?.name}</div></> },
        { key: 'creator', header: 'পোস্টার', render: (j) => j.creator?.name ?? '—' },
        { key: 'status', header: 'স্ট্যাটাস', render: (j) => <span className={`status-pill st-${j.status}`}>{j.status}</span> },
        { key: 'createdAt', header: 'তৈরি', render: (j) => <span className="text-sm muted">{timeAgo(j.createdAt)}</span> },
        { key: 'actions', header: 'অ্যাকশন', render: (j) => (
          <select value={j.status} onChange={(e) => setJobStatus(j.id, e.target.value)} style={{ width: 'auto', padding: '5px 8px' }}>
            {['PENDING_REVIEW','APPROVED','PUBLISHED','REJECTED','CLOSED','EXPIRED'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        ) }
      ]}
    />
  );
}
