'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  return <main className="container section"><h1>Login</h1><form className="form" onSubmit={async (e) => { e.preventDefault(); setError(''); try { await login(email, password); router.push('/dashboard'); } catch (err) { setError(err instanceof Error ? err.message : 'Login failed'); } }}><label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label><label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>{error && <p className="error">{error}</p>}<button>Login</button></form></main>;
}
