'use client';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import type { PackagePlan } from '@/types/api';
import { toBn } from '@/lib/format';

export default function AdminPackages() {
  const [rows, setRows] = useState<PackagePlan[]>([]);
  const [form, setForm] = useState({ name: '', slug: '', price: 0, type: 'JOB', durationDays: 30 });
  useEffect(() => { api.get<PackagePlan[]>('/admin/packages').then(setRows).catch(() => undefined); }, []);
  async function create() {
    const p = await api.post<PackagePlan>('/admin/packages', { ...form, price: Math.round(form.price * 100), currency: 'BDT', isActive: true, sortOrder: rows.length });
    setRows((r) => [...r, p]);
  }
  return (
    <div className="grid" style={{ gridTemplateColumns: '320px minmax(0,1fr)', gap: 18 }}>
      <div className="panel card-pad">
        <h3>নতুন প্যাকেজ</h3>
        <label className="field"><span className="label">নাম</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label className="field"><span className="label">স্লাগ</span><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></label>
        <label className="field"><span className="label">দাম (৳)</span><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></label>
        <label className="field"><span className="label">মেয়াদ (দিন)</span><input type="number" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })} /></label>
        <button className="btn btn-block" onClick={create}>তৈরি করুন</button>
      </div>
      <div className="panel" style={{ overflow: 'hidden' }}>
        <div className="panel-h"><h3>প্যাকেজ তালিকা</h3></div>
        <div className="table-wrap" style={{ border: 'none' }}>
          <table className="table">
            <thead><tr><th>নাম</th><th>ধরন</th><th>দাম</th><th>মেয়াদ</th><th>ফিচার</th></tr></thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong><div className="text-xs muted">{p.slug}</div></td>
                  <td>{p.type}</td>
                  <td>৳{(p.price / 100).toLocaleString('bn-BD')}</td>
                  <td>{toBn(p.durationDays ?? 0)} দিন</td>
                  <td>{p.features?.map((f) => <span key={f.id} className="badge badge-gray" style={{ marginRight: 4 }}>{f.key}:{f.value}</span>)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
