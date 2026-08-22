'use client';
import { useEffect, useState } from 'react';
import { DataTable } from '@/components/admin/DataTable';
import { api } from '@/services/api';
import { timeAgo } from '@/lib/format';

interface Row { id: string; resource: string; resourceId: string; reason: string; status: string; details?: string; createdAt: string; reporter?: { name: string } }
export default function AdminReports() {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => { api.get<Row[]>('/admin/reports').then(setRows).catch(() => undefined); }, []);
  async function setStatus(id: string, status: string) { await api.patch(`/admin/reports/${id}/status`, { status }); setRows((r) => r.map((x) => x.id === id ? { ...x, status } : x)); }
  return <DataTable<Row> title="রিপোর্ট" rows={rows}
    columns={[
      { key: 'resource', header: 'রিসোর্স', render: (r) => `${r.resource}: ${r.resourceId.slice(0, 8)}` },
      { key: 'reason', header: 'কারণ' },
      { key: 'reporter', header: 'রিপোর্টার', render: (r) => r.reporter?.name ?? '—' },
      { key: 'status', header: 'স্ট্যাটাস', render: (r) => <span className={`status-pill st-${r.status}`}>{r.status}</span> },
      { key: 'createdAt', header: 'সময়', render: (r) => <span className="text-sm muted">{timeAgo(r.createdAt)}</span> },
      { key: 'a', header: 'অ্যাকশন', render: (r) => <select value={r.status} onChange={(e) => setStatus(r.id, e.target.value)} style={{ width: 'auto', padding: '5px 8px' }}>{['OPEN','IN_REVIEW','RESOLVED','REJECTED'].map((s) => <option key={s}>{s}</option>)}</select> }
    ]} />;
}
