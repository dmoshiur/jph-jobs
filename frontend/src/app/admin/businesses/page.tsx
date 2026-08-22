'use client';
import { useEffect, useState } from 'react';
import { DataTable } from '@/components/admin/DataTable';
import { api } from '@/services/api';
import { timeAgo } from '@/lib/format';

interface Row { id: string; name: string; category: string; isVerified: boolean; district?: { name: string }; createdAt: string }

export default function AdminBusinesses() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  useEffect(() => { api.get<{ items: Row[]; total: number }>(`/admin/businesses?page=${page}`).then((d) => { setRows(d.items); setTotal(d.total); }).catch(() => undefined); }, [page]);
  async function verify(id: string, isVerified: boolean) { await api.patch(`/admin/businesses/${id}/verify`, { isVerified }); setRows((r) => r.map((b) => b.id === id ? { ...b, isVerified } : b)); }
  return <DataTable<Row> title="ব্যবসা প্রতিষ্ঠান" rows={rows} total={total} page={page} pages={Math.ceil(total / 20)} onPage={setPage}
    columns={[
      { key: 'name', header: 'নাম', render: (b) => <strong>{b.name}</strong> },
      { key: 'category', header: 'ক্যাটাগরি' },
      { key: 'district', header: 'জেলা', render: (b) => b.district?.name ?? '—' },
      { key: 'isVerified', header: 'ভেরিফাইড', render: (b) => b.isVerified ? <span className="badge badge-green">হ্যাঁ</span> : <span className="badge badge-gray">না</span> },
      { key: 'createdAt', header: 'তৈরি', render: (b) => <span className="text-sm muted">{timeAgo(b.createdAt)}</span> },
      { key: 'a', header: 'অ্যাকশন', render: (b) => <button className="btn btn-sm" onClick={() => verify(b.id, !b.isVerified)}>{b.isVerified ? 'আনভেরিফাই' : 'ভেরিফাই'}</button> }
    ]} />;
}
