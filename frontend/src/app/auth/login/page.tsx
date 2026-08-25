'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { Logo } from '@/components/brand/Logo';

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
    } catch (err) { setError(err instanceof Error ? err.message : 'Sign in failed'); }
    finally { setLoading(false); }
  }

  return (
    <div className="bdj-auth-page">
      <div className="bdj-auth-card">
        <div className="bdj-auth-brand"><Logo /></div>
        <h1>Sign in</h1>
        <p className="bdj-auth-sub">Access all of jobhub services</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <label className="field">
            <span className="label">Username, Email or Mobile No</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="Email or mobile" />
          </label>
          <label className="field">
            <span className="label">Password</span>
            <div style={{ position: 'relative' }}>
              <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
              <button type="button" onClick={() => setShow((v) => !v)} className="btn btn-ghost btn-sm" style={{ position: 'absolute', right: 6, top: 4 }}>{show ? 'Hide' : 'Show'}</button>
            </div>
          </label>
          <div className="flex justify-between items-center text-sm" style={{ marginBottom: 12 }}>
            <Link href="/auth/forgot-password" style={{ color: 'var(--bdj-blue)' }}>Forgot Username or Password?</Link>
          </div>
          <button className="btn btn-block btn-lg" disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</button>
        </form>
        <div className="bdj-or">Or</div>
        <GoogleButton label="Continue with Google" />
        <p className="center text-sm muted mt-4 mb-0">
          Don&apos;t have an account? <Link href="/auth/register" style={{ color: 'var(--bdj-blue)', fontWeight: 700 }}>Sign Up</Link>
        </p>
      </div>
      <p className="bdj-disclaimer">
        বিডিজবস-এ প্রকাশিত যেকোনো চাকরি সংক্রান্ত তথ্য নিয়োগকারী প্রতিষ্ঠান কর্তৃক দেওয়া হয়ে থাকে।
        প্রকাশিত যেকোনো ধরণের চাকরি তথ্য বা নিয়োগ-প্রক্রিয়ার দায়-দায়িত্ব স্ব-স্ব নিয়োগকারী প্রতিষ্ঠানের।
        {' '}<strong>চাকরিপ্রার্থীদের এই ব্যাপারে সতর্ক হবার জন্য পরামর্শ দেওয়া হচ্ছে।</strong>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
