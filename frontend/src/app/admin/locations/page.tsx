'use client';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';

interface Loc { id: string; name: string; type: string; slug: string; parent?: { name: string } | null }

export default function AdminLocations() {
  const [rows, setRows] = useState<Loc[]>([]);
  useEffect(() => { api.get<Loc[]>('/admin/locations').then(setRows).catch(() => undefined); }, []);
  return (
    <div className="panel" style={{ overflow: 'hidden' }}>
      <div className="panel-h"><h3>লোকেশন ব্যবস্থাপনা</h3></div>
      <div className="table-wrap" style={{ border: 'none' }}>
        <table className="table">
          <thead><tr><th>নাম</th><th>ধরন</th><th>প্যারেন্ট</th><th>স্লাগ</th></tr></thead>
          <tbody>{rows.map((l) => <tr key={l.id}><td><strong>{l.name}</strong></td><td><span className="badge badge-gray">{l.type}</span></td><td>{l.parent?.name ?? '—'}</td><td className="text-sm muted">{l.slug}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
