'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { useToast } from '@/components/ui/Toast';
import { COMPANY_RANKS, rankLabel } from '@/lib/ranks';
import { LoadingRows } from '@/components/ui/Feedback';
import type { Company } from '@/types/api';

interface Member {
  id: string;
  role: string;
  title?: string | null;
  user: { id: string; name: string; email: string };
}

interface MineCompany extends Company {
  myRank?: string;
}

export default function TeamPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [companies, setCompanies] = useState<MineCompany[]>([]);
  const [companyId, setCompanyId] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState('');
  const [rank, setRank] = useState('dm');
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login?next=/dashboard/employer/team');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    api.get<MineCompany[]>('/companies/mine').then((list) => {
      setCompanies(list);
      if (list[0]) setCompanyId(list[0].id);
    }).catch(() => undefined);
  }, [user]);

  useEffect(() => {
    if (!companyId) return;
    api.get<Member[]>(`/companies/${companyId}/members`).then(setMembers).catch(() => setMembers([]));
  }, [companyId]);

  async function addMember() {
    try {
      const member = await api.post<Member>(`/companies/${companyId}/members`, { email, rank, title });
      setMembers((s) => [...s.filter((m) => m.id !== member.id), member]);
      setEmail(''); setTitle('');
      toast('টিম মেম্বার যোগ হয়েছে', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'যোগ করা যায়নি', 'error');
    }
  }

  async function changeRank(memberId: string, next: string) {
    try {
      const updated = await api.patch<Member>(`/companies/${companyId}/members/${memberId}`, { rank: next });
      setMembers((s) => s.map((m) => (m.id === memberId ? updated : m)));
      toast('র‍্যাঙ্ক আপডেট হয়েছে', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'আপডেট ব্যর্থ', 'error');
    }
  }

  async function remove(memberId: string) {
    try {
      await api.delete(`/companies/${companyId}/members/${memberId}`);
      setMembers((s) => s.filter((m) => m.id !== memberId));
      toast('সরানো হয়েছে', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'সরানো যায়নি', 'error');
    }
  }

  if (loading || !user) return <div className="container section"><LoadingRows /></div>;

  return (
    <div className="container" style={{ padding: '24px 0', maxWidth: 880 }}>
      <nav className="crumb"><Link href="/dashboard/employer">ড্যাশবোর্ড</Link> <span>/</span> <span>টিম ও র‍্যাঙ্ক</span></nav>
      <h1>কোম্পানি টিম</h1>
      <p className="muted">MD, GM, AGM, DGM, DM, ACM, Manager বা Shop Owner র‍্যাঙ্ক দিন। র‍্যাঙ্ক অনুযায়ী চাকরি পোস্ট ও সেটিংস খোলে।</p>

      {companies.length === 0 ? (
        <div className="panel card-pad">
          <p>আগে কোম্পানি বা দোকান প্রোফাইল তৈরি করুন।</p>
          <Link href="/employers/profile" className="btn">প্রোফাইল তৈরি</Link>
        </div>
      ) : (
        <div className="panel card-pad">
          <label className="field"><span className="label">কোম্পানি / দোকান</span>
            <select value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name} {c.myRank ? `(${rankLabel(c.myRank, true)})` : ''}</option>)}
            </select>
          </label>

          <div className="grid grid-2" style={{ alignItems: 'end' }}>
            <label className="field"><span className="label">ইউজার ইমেইল</span><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="already registered user" /></label>
            <label className="field"><span className="label">র‍্যাঙ্ক</span>
              <select value={rank} onChange={(e) => setRank(e.target.value)}>
                {COMPANY_RANKS.filter((r) => r.id !== 'owner').map((r) => <option key={r.id} value={r.id}>{r.labelBn}</option>)}
              </select>
            </label>
            <label className="field"><span className="label">পদবী (ঐচ্ছিক)</span><input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
            <button className="btn" onClick={addMember} disabled={!email || !companyId}>মেম্বার যোগ করুন</button>
          </div>

          <div className="table-wrap mt-4">
            <table className="table">
              <thead><tr><th>নাম</th><th>ইমেইল</th><th>র‍্যাঙ্ক</th><th></th></tr></thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id}>
                    <td>{m.user.name}{m.title ? <div className="text-xs muted">{m.title}</div> : null}</td>
                    <td>{m.user.email}</td>
                    <td>
                      <select value={m.role} onChange={(e) => changeRank(m.id, e.target.value)} style={{ width: 'auto' }}>
                        {COMPANY_RANKS.map((r) => <option key={r.id} value={r.id}>{r.labelBn}</option>)}
                      </select>
                    </td>
                    <td><button className="btn btn-ghost btn-sm" onClick={() => remove(m.id)}>সরান</button></td>
                  </tr>
                ))}
                {members.length === 0 && <tr><td colSpan={4} className="muted">এখনো কোনো মেম্বার নেই।</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
