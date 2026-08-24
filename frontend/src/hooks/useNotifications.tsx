'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { realtimeDb } from '@/services/firebase';
import type { Notification } from '@/types/api';

/**
 * Live notifications: seeds from the REST API (Firestore source of truth) and
 * then subscribes to the Realtime Database mirror for instant updates.
 */
export function useNotifications(userId?: string) {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!userId) { setItems([]); setUnread(0); return; }

    let active = true;
    api.get<Notification[]>('/notifications')
      .then((data) => { if (active) { setItems(data); setUnread(data.filter((n) => !n.readAt).length); } })
      .catch(() => undefined);

    const db = realtimeDb();
    if (!db) return () => { active = false; };

    let unsubRef: (() => void) | undefined;
    (async () => {
      const { ref, onValue, off } = await import('firebase/database');
      const nRef = ref(db, `notifications/${userId}`);
      const handler = onValue(nRef, (snap) => {
        const val = snap.val() as Record<string, Notification> | null;
        if (!val) return;
        const list = Object.values(val).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        if (active) { setItems(list); setUnread(list.filter((n) => !n.readAt).length); }
      });
      unsubRef = () => off(nRef, 'value', handler);
    })();

    return () => { active = false; unsubRef?.(); };
  }, [userId]);

  async function markRead(id: string) {
    await api.patch(`/notifications/${id}/read`).catch(() => undefined);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
    setUnread((u) => Math.max(0, u - 1));
  }

  return { items, unread, markRead };
}
