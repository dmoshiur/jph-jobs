'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';

type AccountType = 'candidate' | 'employer' | 'shop-owner';

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { register } = useAuth();
  const initialType = (params.get('type') === 'shop-owner' || params.get('type') === 'employer' || params.get('type') === 'candidate')
    ? params.get('type') as AccountType
    : 'candidate';
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', accountType: initialType });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      await register(form);
      setSuccess('নিবন্ধন সফল! লগইন করুন।');
      setTimeout(() => router.push('/auth/login'), 1200);
    } catch (err) { setError(err instanceof Error ? err.message : 'নিবন্ধন ব্যর্থ'); }
    finally { setLoading(false); }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card panel">
        <div className="center" style={{ marginBottom: 18 }}>
          <div className="logo" style={{ justifyContent: 'center' }}><span className="logo-mark">jh</span> jobhub</div>
          <h1 style={{ fontSize: '1.4rem', marginTop: 14 }}>অ্যাকাউন্ট তৈরি করুন</h1>
          <p className="muted">বগুড়া ও জয়পুরহাটের চাকরি প্ল্যাটফর্ম</p>
        </div>

        <div className="account-toggle" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          {([
            { id: 'candidate' as const, label: 'প্রার্থী' },
            { id: 'employer' as const, label: 'কোম্পানি' },
            { id: 'shop-owner' as const, label: 'দোকান' }
          ]).map((opt) => (
            <button key={opt.id} type="button" onClick={() => setForm({ ...form, accountType: opt.id })}
              className={form.accountType === opt.id ? 'btn' : 'btn btn-secondary'}>
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-sm muted">
          {form.accountType === 'candidate' && 'চাকরি খুঁজুন ও আবেদন করুন।'}
          {form.accountType === 'employer' && 'কোম্পানি খুলুন, MD/GM/AGM/DM/ACM র‍্যাঙ্ক দিন, চাকরি পোস্ট করুন।'}
          {form.accountType === 'shop-owner' && 'দোকানের সেটিংস পরিচালনা করুন এবং চাকরি পোস্ট করুন।'}
        </p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={submit} className="form" style={{ maxWidth: '100%' }}>
          <label className="field"><span className="label">পূর্ণ নাম</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2} /></label>
          <label className="field"><span className="label">ইমেইল</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
          <label className="field"><span className="label">মোবাইল (ঐচ্ছিক)</span><input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01XXXXXXXXX" /></label>
          <label className="field">
            <span className="label">পাসওয়ার্ড</span>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
            <span className="form-help">কমপক্ষে ৮ অক্ষর, একটি বড় হাতের অক্ষর ও একটি সংখ্যা</span>
          </label>
          <button className="btn btn-block btn-lg" disabled={loading}>{loading ? 'তৈরি হচ্ছে…' : 'অ্যাকাউন্ট তৈরি করুন'}</button>
        </form>
        <p className="center text-sm muted mt-4 mb-0">ইতিমধ্যে অ্যাকাউন্ট আছে? <Link href="/auth/login" style={{ color: 'var(--primary-600)', fontWeight: 600 }}>লগইন করুন</Link></p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>;
}
