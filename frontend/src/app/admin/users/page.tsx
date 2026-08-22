'use client';

import { useEffect, useState } from 'react';
import { DataTable } from '@/components/admin/DataTable';
import { api } from '@/services/api';
import { timeAgo } from '@/lib/format';
import type { CurrentUser } from '@/types/api';

interface Row extends CurrentUser { phone?: string; createdAt: string; roles: any[]; status: string }

export default function AdminUsers() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');

  useEffect(() => {
    api.get<{ items: Row[]; total: number }>(`/admin/users?page=${page}&q=${encodeURIComponent(q)}`).then((d) => { setRows(d.items); setTotal(d.total); }).catch(() => undefined);
  }, [page, q]);

  async function setStatus(id: string, status: string) {
    await api.patch(`/admin/users/${id}/status`, { status });
    setRows((r) => r.map((u) => u.id === id ? { ...u, status } : u));
  }

  return (
    <DataTable<Row>
      title="ব্যবহারকারী ব্যবস্থাপনা"
      search={q} onSearch={setQ}
      rows={rows} total={total} page={page} pages={Math.ceil(total / 20)} onPage={setPage}
      columns={[
        { key: 'name', header: 'নাম', render: (u) => <><strong>{u.name}</strong><div className="text-xs muted">{u.email}</div></> },
        { key: 'phone', header: 'ফোন', render: (u) => u.phone ?? '—' },
        { key: 'roles', header: 'ভূমিকা', render: (u) => u.roles?.map((r) => <span key={r.role?.id} className="badge badge-blue" style={{ marginRight: 4 }}>{r.role?.slug}</span>) },
        { key: 'status', header: 'স্ট্যাটাস', render: (u) => <span className={`status-pill st-${u.status}`}>{u.status}</span> },
        { key: 'createdAt', header: 'যোগদান', render: (u) => <span className="text-sm muted">{timeAgo(u.createdAt)}</span> },
        { key: 'actions', header: 'অ্যাকশন', render: (u) => (
          <select value={u.status} onChange={(e) => setStatus(u.id, e.target.value)} style={{ width: 'auto', padding: '5px 8px' }}>
            {['ACTIVE', 'PENDING', 'SUSPENDED', 'DISABLED'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        ) }
      ]}
    />
  );
}
