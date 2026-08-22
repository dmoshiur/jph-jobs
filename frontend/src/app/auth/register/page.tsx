'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', accountType: 'candidate' as 'candidate' | 'employer' });
  const [message, setMessage] = useState('');
  return <main className="container section"><h1>Create account</h1><form className="form" onSubmit={async (e) => { e.preventDefault(); try { await register(form); setMessage('Registration successful. You can login now.'); } catch (err) { setMessage(err instanceof Error ? err.message : 'Registration failed'); } }}><label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label><label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label><label>Account type<select value={form.accountType} onChange={(e) => setForm({ ...form, accountType: e.target.value as 'candidate' | 'employer' })}><option value="candidate">Candidate</option><option value="employer">Employer</option></select></label><label>Password<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>{message && <p className={message.includes('successful') ? 'success' : 'error'}>{message}</p>}<button>Create account</button><Link href="/auth/login">Already have an account?</Link></form></main>;
}
