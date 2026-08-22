'use client';

import { useEffect, useState } from 'react';
import { DataTable } from '@/components/admin/DataTable';
import { api } from '@/services/api';
import { timeAgo } from '@/lib/format';

interface Row { id: string; name: string; category?: string; verificationStatus: string; createdAt: string; district?: { name: string }; owner?: { name: string; email: string } }

export default function AdminCompanies() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get<{ items: Row[]; total: number }>(`/admin/companies?page=${page}`).then((d) => { setRows(d.items); setTotal(d.total); }).catch(() => undefined);
  }, [page]);

  async function verify(id: string, s: string) {
    await api.patch(`/admin/companies/${id}/verification`, { verificationStatus: s });
    setRows((r) => r.map((c) => c.id === id ? { ...c, verificationStatus: s } : c));
  }

  return (
    <DataTable<Row>
      title="কোম্পানি ভেরিফিকেশন"
      rows={rows} total={total} page={page} pages={Math.ceil(total / 20)} onPage={setPage}
      columns={[
        { key: 'name', header: 'কোম্পানি', render: (c) => <><strong>{c.name}</strong><div className="text-xs muted">{c.category} · {c.district?.name}</div></> },
        { key: 'owner', header: 'মালিক', render: (c) => c.owner?.email ?? '—' },
        { key: 'verificationStatus', header: 'ভেরিফিকেশন', render: (c) => <span className={`status-pill st-${c.verificationStatus}`}>{c.verificationStatus}</span> },
        { key: 'createdAt', header: 'তৈরি', render: (c) => <span className="text-sm muted">{timeAgo(c.createdAt)}</span> },
        { key: 'actions', header: 'অ্যাকশন', render: (c) => (
          <select value={c.verificationStatus} onChange={(e) => verify(c.id, e.target.value)} style={{ width: 'auto', padding: '5px 8px' }}>
            {['PENDING','VERIFIED','REJECTED','SUSPENDED'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        ) }
      ]}
    />
  );
}
