'use client';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { timeAgo } from '@/lib/format';

interface Admin { id: string; name: string; email: string; status: string; createdAt: string; roles: { role: { slug: string; name: string } }[] }

export default function AdminAdmins() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<Admin[]>([]);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const isRoot = user?.roles.includes('root-admin');

  useEffect(() => { api.get<Admin[]>('/admin/admins').then(setRows).catch(() => undefined); }, []);

  async function create() {
    try {
      const a = await api.post<Admin>('/admin/admins/super-admins', form);
      setRows((r) => [a as Admin, ...r]);
      setForm({ name: '', email: '', password: '' });
      toast('সুপার অ্যাডমিন তৈরি হয়েছে', 'success');
    } catch (e) { toast(e instanceof Error ? e.message : 'ব্যর্থ', 'error'); }
  }
  async function disable(id: string) {
    if (!confirm('নিষ্ক্রিয় করবেন?')) return;
    await api.delete(`/admin/admins/${id}`);
    setRows((r) => r.map((a) => a.id === id ? { ...a, status: 'DISABLED' } : a));
  }

  return (
    <div className="grid" style={{ gridTemplateColumns: isRoot ? '340px minmax(0,1fr)' : '1fr', gap: 18 }}>
      {isRoot && (
        <div className="panel card-pad">
          <h3>নতুন সুপার অ্যাডমিন</h3>
          <p className="text-sm muted">শুধুমাত্র রুট অ্যাডমিন নতুন সুপার অ্যাডমিন তৈরি করতে পারেন।</p>
          <label className="field"><span className="label">নাম</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className="field"><span className="label">ইমেইল</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label className="field"><span className="label">পাসওয়ার্ড (কমপক্ষে ১২ অক্ষর)</span><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
          <button className="btn btn-block" onClick={create}>তৈরি করুন</button>
        </div>
      )}
      <div className="panel" style={{ overflow: 'hidden' }}>
        <div className="panel-h"><h3>অ্যাডমিন তালিকা</h3></div>
        <div className="table-wrap" style={{ border: 'none' }}>
          <table className="table">
            <thead><tr><th>নাম</th><th>ইমেইল</th><th>ভূমিকা</th><th>স্ট্যাটাস</th><th>তৈরি</th><th></th></tr></thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td><strong>{a.name}</strong></td>
                  <td className="text-sm">{a.email}</td>
                  <td>{a.roles.map((r) => <span key={r.role.slug} className="badge badge-blue" style={{ marginRight: 4 }}>{r.role.slug}</span>)}</td>
                  <td><span className={`status-pill st-${a.status}`}>{a.status}</span></td>
                  <td className="text-sm muted">{timeAgo(a.createdAt)}</td>
                  <td>{isRoot && !a.roles.some((r) => r.role.slug === 'root-admin') && a.status !== 'DISABLED' && <button className="btn btn-danger btn-sm" onClick={() => disable(a.id)}>নিষ্ক্রিয়</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
