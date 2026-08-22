'use client';
import { useEffect, useState } from 'react';
import { StatCard } from '@/components/StatCard';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';

type Analytics = { totalUsers: number; candidates: number; employers: number; companies: number; activeJobs: number; applications: number; revenue: number; paymentSuccessRate: number };
type Audit = { id: string; action: string; resource: string; createdAt: string; admin?: { email: string } };

export default function AdminPage() {
  const { user, loading, hasPermission } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [auditLogs, setAuditLogs] = useState<Audit[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !hasPermission('analytics.view')) return;
    void api.get<Analytics>('/admin/analytics').then(setAnalytics).catch((err) => setError(err.message));
    if (hasPermission('audit_logs.view')) void api.get<Audit[]>('/admin/audit-logs').then(setAuditLogs).catch(() => undefined);
  }, [user, hasPermission]);

  if (loading) return <main className="container section"><p>Loading...</p></main>;
  if (!user) return <main className="container section"><h1>Admin</h1><p className="error">Login required.</p></main>;
  if (!hasPermission('analytics.view')) return <main className="container section"><h1>Admin</h1><p className="error">Your account is authenticated, but backend permissions do not allow admin analytics.</p></main>;

  return <main className="container section"><h1>Super Admin dashboard</h1><p>UI actions call `/api/v1/admin/*`; backend enforces RBAC and audit logging.</p>{error && <p className="error">{error}</p>}{analytics && <div className="grid four"><div className="grid three" style={{ gridColumn: '1 / -1' }}><StatCard label="Users" value={analytics.totalUsers} /><StatCard label="Companies" value={analytics.companies} /><StatCard label="Active jobs" value={analytics.activeJobs} /><StatCard label="Applications" value={analytics.applications} /><StatCard label="Revenue" value={`৳${(analytics.revenue / 100).toLocaleString()}`} /><StatCard label="Payment success" value={`${Math.round(analytics.paymentSuccessRate * 100)}%`} /></div></div>}<section className="panel" style={{ marginTop: 24 }}><h2>Recent audit logs</h2><table className="table"><thead><tr><th>Action</th><th>Resource</th><th>Admin</th><th>Time</th></tr></thead><tbody>{auditLogs.map((log) => <tr key={log.id}><td>{log.action}</td><td>{log.resource}</td><td>{log.admin?.email ?? 'system'}</td><td>{new Date(log.createdAt).toLocaleString()}</td></tr>)}</tbody></table></section></main>;
}
