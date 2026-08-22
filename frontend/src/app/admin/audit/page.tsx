'use client';
import { useEffect, useState } from 'react';
import { DataTable } from '@/components/admin/DataTable';
import { api } from '@/services/api';
import { timeAgo } from '@/lib/format';

interface Row { id: string; action: string; resource: string; resourceId?: string; ip?: string; createdAt: string; admin?: { name: string; email: string } }
export default function AuditLogs() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  useEffect(() => { api.get<{ items: Row[]; total: number }>(`/admin/audit-logs?page=${page}`).then((d) => { setRows(d.items); setTotal(d.total); }).catch(() => undefined); }, [page]);
  return <DataTable<Row> title="অডিট লগ" rows={rows} total={total} page={page} pages={Math.ceil(total / 50)} onPage={setPage}
    columns={[
      { key: 'action', header: 'অ্যাকশন', render: (l) => <code style={{ fontSize: '.78rem', background: 'var(--gray-100)', padding: '2px 6px', borderRadius: 4 }}>{l.action}</code> },
      { key: 'resource', header: 'রিসোর্স', render: (l) => `${l.resource}${l.resourceId ? ':' + l.resourceId.slice(0, 6) : ''}` },
      { key: 'admin', header: 'অ্যাডমিন', render: (l) => l.admin?.name ?? 'system' },
      { key: 'ip', header: 'IP', render: (l) => l.ip ?? '—' },
      { key: 'createdAt', header: 'সময়', render: (l) => <span className="text-sm muted">{timeAgo(l.createdAt)}</span> }
    ]} />;
}
