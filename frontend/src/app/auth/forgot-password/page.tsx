'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/brand/Logo';

export default function Forgot() {
  const { forgotPassword } = useAuth();
  const [e, setE] = useState('');
  const [s, setS] = useState(false);

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    await forgotPassword(e);
    setS(true);
  }

  return (
    <div className="bdj-auth-page">
      <div className="bdj-auth-card">
        <div className="bdj-auth-brand"><Logo /></div>
        <h1>Forgot Username or Password?</h1>
        <p className="bdj-auth-sub">Enter your email to receive a reset link</p>
        {s ? (
          <div className="alert alert-success">If an account exists, a reset link has been sent.</div>
        ) : (
          <form onSubmit={submit}>
            <label className="field">
              <span className="label">Username, Email or Mobile No</span>
              <input type="email" value={e} onChange={(x) => setE(x.target.value)} required />
            </label>
            <button className="btn btn-block">Send reset link</button>
          </form>
        )}
        <p className="center text-sm muted mt-4 mb-0">
          <Link href="/auth/login" style={{ color: 'var(--bdj-blue)', fontWeight: 700 }}>Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}
