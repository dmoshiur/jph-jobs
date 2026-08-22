'use client';
import { useEffect, useState } from 'react';
import { DataTable } from '@/components/admin/DataTable';
import { api } from '@/services/api';
import { timeAgo } from '@/lib/format';

interface Row { id: string; rating: number; comment?: string; status: string; createdAt: string; user?: { name: string }; company?: { name: string } }
export default function AdminReviews() {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => { api.get<Row[]>('/admin/reviews').then(setRows).catch(() => undefined); }, []);
  async function setStatus(id: string, status: string) { await api.patch(`/admin/reviews/${id}/status`, { status }); setRows((r) => r.map((x) => x.id === id ? { ...x, status } : x)); }
  return <DataTable<Row> title="রিভিউ মডারেশন" rows={rows}
    columns={[
      { key: 'company', header: 'কোম্পানি', render: (r) => r.company?.name ?? '—' },
      { key: 'user', header: 'ব্যবহারকারী', render: (r) => r.user?.name ?? '—' },
      { key: 'rating', header: 'রেটিং', render: (r) => '⭐'.repeat(r.rating) },
      { key: 'comment', header: 'মন্তব্য', render: (r) => <span className="text-sm">{(r.comment ?? '').slice(0, 60)}</span> },
      { key: 'status', header: 'স্ট্যাটাস', render: (r) => <span className={`status-pill st-${r.status}`}>{r.status}</span> },
      { key: 'createdAt', header: 'সময়', render: (r) => <span className="text-sm muted">{timeAgo(r.createdAt)}</span> },
      { key: 'a', header: 'অ্যাকশন', render: (r) => <select value={r.status} onChange={(e) => setStatus(r.id, e.target.value)} style={{ width: 'auto', padding: '5px 8px' }}>{['PENDING','APPROVED','REJECTED'].map((s) => <option key={s}>{s}</option>)}</select> }
    ]} />;
}
