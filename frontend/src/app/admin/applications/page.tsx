'use client';
import { useEffect, useState } from 'react';
import { DataTable } from '@/components/admin/DataTable';
import { api } from '@/services/api';
import { timeAgo, statusLabel } from '@/lib/format';

interface Row { id: string; status: string; createdAt: string; job?: { title: string; company?: { name: string } }; candidate?: { name: string; email: string } }

export default function AdminApplications() {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => { api.get<Row[]>('/admin/applications').then(setRows).catch(() => undefined); }, []);
  return <DataTable<Row> title="সকল আবেদন" rows={rows}
    columns={[
      { key: 'candidate', header: 'প্রার্থী', render: (a) => <><strong>{a.candidate?.name}</strong><div className="text-xs muted">{a.candidate?.email}</div></> },
      { key: 'job', header: 'পদ', render: (a) => <>{a.job?.title}<div className="text-xs muted">{a.job?.company?.name}</div></> },
      { key: 'status', header: 'স্ট্যাটাস', render: (a) => <span className={`status-pill st-${a.status}`}>{statusLabel(a.status)}</span> },
      { key: 'createdAt', header: 'জমা', render: (a) => <span className="text-sm muted">{timeAgo(a.createdAt)}</span> }
    ]} />;
}
