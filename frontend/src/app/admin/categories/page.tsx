'use client';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { toBn } from '@/lib/format';

interface Cat { id: string; name: string; slug: string; _count?: { jobs: number } }

export default function AdminCategories() {
  const [rows, setRows] = useState<Cat[]>([]);
  const [name, setName] = useState('');
  useEffect(() => { api.get<Cat[]>('/admin/categories').then(setRows).catch(() => undefined); }, []);
  async function add() {
    if (!name.trim()) return;
    const c = await api.post<Cat>('/admin/categories', { name });
    setRows((r) => [...r, c]); setName('');
  }
  return (
    <div className="panel card-pad">
      <h3>ক্যাটাগরি ব্যবস্থাপনা</h3>
      <div className="flex gap-2 mb-4">
        <input placeholder="নতুন ক্যাটাগরি" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <button className="btn" onClick={add}>যোগ করুন</button>
      </div>
      <div className="grid grid-3" style={{ gap: 8 }}>
        {rows.map((c) => <div key={c.id} className="chip" style={{ justifyContent: 'space-between' }}>{c.name} <span className="cnt">{toBn(c._count?.jobs ?? 0)}</span></div>)}
      </div>
    </div>
  );
}
