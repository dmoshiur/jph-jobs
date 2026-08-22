'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { timeAgo } from '@/lib/format';
import type { Notification } from '@/types/api';

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login?next=/notifications');
    if (user) api.get<Notification[]>('/notifications').then(setItems).catch(() => undefined);
  }, [user, loading, router]);

  return (
    <div className="container" style={{ padding: '24px 0', maxWidth: 760 }}>
      <h1 style={{ fontSize: '1.5rem' }}>নোটিফিকেশন</h1>
      <div className="panel card-pad" style={{ padding: 0 }}>
        {items.length === 0 ? <div className="state"><div className="state-icon">🔔</div><p>কোনো নোটিফিকেশন নেই</p></div>
          : items.map((n) => (
            <div key={n.id} style={{ padding: 14, borderBottom: '1px solid var(--border)', background: n.readAt ? '#fff' : 'var(--primary-50)' }}>
              <div style={{ fontWeight: 700 }}>{n.title}</div>
              <div className="text-sm muted" style={{ marginBottom: 4 }}>{n.body}</div>
              <div className="text-xs muted">{timeAgo(n.createdAt)}</div>
            </div>
          ))}
      </div>
    </div>
  );
}
