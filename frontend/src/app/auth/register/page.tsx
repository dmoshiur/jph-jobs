'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { Logo } from '@/components/brand/Logo';

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
      setSuccess('Account created. Taking you in…');
      setTimeout(() => router.push('/dashboard'), 800);
    } catch (err) { setError(err instanceof Error ? err.message : 'Sign up failed'); }
    finally { setLoading(false); }
  }

  return (
    <div className="bdj-auth-page">
      <div className="bdj-auth-card">
        <div className="bdj-auth-brand"><Logo /></div>
        <h1>Create account</h1>
        <p className="bdj-auth-sub">Access all of jobhub services</p>

        <div className="bdj-role-tabs">
          <button type="button" className={form.accountType === 'candidate' ? 'on' : ''} onClick={() => setForm({ ...form, accountType: 'candidate' })}>Job Seeker</button>
          <button type="button" className={form.accountType !== 'candidate' ? 'on' : ''} onClick={() => setForm({ ...form, accountType: 'employer' })}>Recruiter</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={submit}>
          <label className="field"><span className="label">Full Name</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2} /></label>
          <label className="field"><span className="label">Email</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
          <label className="field"><span className="label">Mobile No</span><input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01XXXXXXXXX" /></label>
          <label className="field">
            <span className="label">Password</span>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
            <span className="form-help">At least 8 characters, one uppercase letter and one number</span>
          </label>
          <button className="btn btn-block btn-lg" disabled={loading}>{loading ? 'Creating…' : 'Sign Up'}</button>
        </form>
        <div className="bdj-or">Or</div>
        <GoogleButton label="Continue with Google" />
        <p className="center text-sm muted mt-4 mb-0">
          Already have an account? <Link href="/auth/login" style={{ color: 'var(--bdj-blue)', fontWeight: 700 }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>;
}
