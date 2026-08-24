'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { timeAgo } from '@/lib/format';

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { items, markRead } = useNotifications(user?.id);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login?next=/notifications');
  }, [user, loading, router]);

  return (
    <div className="container" style={{ padding: '24px 0', maxWidth: 760 }}>
      <h1 style={{ fontSize: '1.5rem' }}>নোটিফিকেশন</h1>
      <div className="panel card-pad" style={{ padding: 0 }}>
        {items.length === 0 ? <div className="state"><div className="state-icon">🔔</div><p>কোনো নোটিফিকেশন নেই</p></div>
          : items.map((n) => (
            <div key={n.id} onClick={() => !n.readAt && markRead(n.id)}
              style={{ padding: 14, borderBottom: '1px solid var(--border)', background: n.readAt ? '#fff' : 'var(--primary-50)', cursor: n.readAt ? 'default' : 'pointer' }}>
              <div style={{ fontWeight: 700 }}>{n.title}</div>
              <div className="text-sm muted" style={{ marginBottom: 4 }}>{n.body}</div>
              <div className="text-xs muted">{timeAgo(n.createdAt)}</div>
            </div>
          ))}
      </div>
    </div>
  );
}
