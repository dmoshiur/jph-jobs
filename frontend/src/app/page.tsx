import Link from 'next/link';
import { StatCard } from '@/components/StatCard';

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="badge">Bogura · Joypurhat · Bangladesh</span>
            <h1>Local jobs, trusted companies, and neighborhood businesses.</h1>
            <p>JPH Jobs connects candidates, employers, recruiters, and local businesses through a secure Netlify frontend and Vercel backend API.</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/jobs" className="button">Find jobs</Link>
              <Link href="/auth/register" className="button secondary">Create account</Link>
            </div>
          </div>
          <div className="search-panel">
            <h2>Production-ready architecture</h2>
            <p>Authentication, RBAC, payments, audit logs, packages, applications, admin controls and database-driven locations are handled by the backend only.</p>
            <div className="grid two">
              <StatCard label="Initial districts" value="2" />
              <StatCard label="Admin modules" value="20+" />
            </div>
          </div>
        </div>
      </section>
      <section className="container section grid three">
        <div className="card"><h3>For candidates</h3><p>Build a profile, upload CV securely, save jobs, apply, and track status.</p></div>
        <div className="card"><h3>For employers</h3><p>Create companies, post jobs, manage applications, buy packages and download invoices.</p></div>
        <div className="card"><h3>For admins</h3><p>Manage users, jobs, companies, payments, settings, RBAC, and immutable audit logs.</p></div>
      </section>
    </main>
  );
}
