'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(email, password);
      router.push(params.get('next') || '/dashboard');
    } catch (err) { setError(err instanceof Error ? err.message : 'লগইন ব্যর্থ'); }
    finally { setLoading(false); }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card panel">
        <div className="center" style={{ marginBottom: 18 }}>
          <div className="logo" style={{ justifyContent: 'center' }}><span className="logo-mark">JH</span> JOBHUB</div>
          <h1 style={{ fontSize: '1.4rem', marginTop: 14 }}>আবার স্বাগতম</h1>
          <p className="muted">আপনার অ্যাকাউন্টে লগইন করুন</p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit} className="form" style={{ maxWidth: '100%' }}>
          <label className="field">
            <span className="label">ইমেইল</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" />
          </label>
          <label className="field">
            <span className="label">পাসওয়ার্ড</span>
            <div style={{ position: 'relative' }}>
              <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
              <button type="button" onClick={() => setShow((v) => !v)} className="btn btn-ghost btn-sm" style={{ position: 'absolute', right: 6, top: 4 }}>{show ? 'লুকান' : 'দেখুন'}</button>
            </div>
          </label>
          <div className="flex justify-between items-center text-sm">
            <label className="check-row" style={{ margin: 0 }}><input type="checkbox" /> আমাকে মনে রাখুন</label>
            <Link href="/auth/forgot-password" style={{ color: 'var(--primary-600)' }}>পাসওয়ার্ড ভুলে গেছেন?</Link>
          </div>
          <button className="btn btn-block btn-lg" disabled={loading}>{loading ? 'প্রবেশ করা হচ্ছে…' : 'লগইন করুন'}</button>
        </form>
        <p className="center text-sm muted mt-4 mb-0">অ্যাকাউন্ট নেই? <Link href="/auth/register" style={{ color: 'var(--primary-600)', fontWeight: 600 }}>নিবন্ধন করুন</Link></p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
