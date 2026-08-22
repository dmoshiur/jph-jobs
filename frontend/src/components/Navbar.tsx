'use client';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export function Navbar() {
  const { user, logout } = useAuth();
  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link href="/" className="logo">JPH Jobs</Link>
        <nav className="nav-links">
          <Link href="/jobs">Jobs</Link>
          <Link href="/companies">Companies</Link>
          <Link href="/businesses">Businesses</Link>
          <Link href="/dashboard">Dashboard</Link>
          {user?.permissions?.length ? <Link href="/admin">Admin</Link> : null}
          {user ? <button type="button" className="button secondary" onClick={() => void logout()}>Logout</button> : <Link className="button" href="/auth/login">Login</Link>}
        </nav>
      </div>
    </header>
  );
}
