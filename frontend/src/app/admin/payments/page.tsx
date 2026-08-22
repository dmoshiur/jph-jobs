'use client';

import { useEffect, useState } from 'react';
import { DataTable } from '@/components/admin/DataTable';
import { api } from '@/services/api';
import { timeAgo } from '@/lib/format';

interface Payment {
  id: string; amount: number; currency: string; status: string; provider: string;
  providerTransactionId?: string; createdAt: string;
  user?: { name: string; email: string };
  order?: { id: string; purpose: string; package?: { name: string } };
}

export default function AdminPayments() {
  const [rows, setRows] = useState<Payment[]>([]);
  useEffect(() => { api.get<Payment[]>('/admin/payments').then(setRows).catch(() => undefined); }, []);

  async function refund(id: string) {
    if (!confirm('এই পেমেন্ট ফেরত দিতে চান?')) return;
    await api.post(`/admin/payments/${id}/refund`);
    setRows((r) => r.map((p) => p.id === id ? { ...p, status: 'REFUNDED' } : p));
  }

  return (
    <DataTable<Payment>
      title="পেমেন্ট ও লেনদেন"
      rows={rows}
      columns={[
        { key: 'id', header: 'ID', render: (p) => <span className="text-xs">{p.id.slice(0, 8)}</span> },
        { key: 'user', header: 'গ্রাহক', render: (p) => <>{p.user?.name}<div className="text-xs muted">{p.user?.email}</div></> },
        { key: 'amount', header: 'পরিমাণ', render: (p) => `৳${(p.amount / 100).toLocaleString('bn-BD')}` },
        { key: 'order', header: 'প্যাকেজ', render: (p) => p.order?.package?.name ?? p.order?.purpose ?? '—' },
        { key: 'provider', header: 'গেটওয়ে', render: (p) => p.provider },
        { key: 'status', header: 'স্ট্যাটাস', render: (p) => <span className={`status-pill st-${p.status}`}>{p.status}</span> },
        { key: 'createdAt', header: 'সময়', render: (p) => <span className="text-sm muted">{timeAgo(p.createdAt)}</span> },
        { key: 'actions', header: 'অ্যাকশন', render: (p) => p.status === 'SUCCESS' ? <button className="btn btn-danger btn-sm" onClick={() => refund(p.id)}>ফেরত</button> : null }
      ]}
    />
  );
}
