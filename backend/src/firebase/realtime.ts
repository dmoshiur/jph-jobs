/**
 * Realtime Database mirror for notifications.
 *
 * Firestore remains the source of truth for notifications; we additionally push
 * a lightweight copy to the Realtime Database at `notifications/{userId}/{id}`
 * so clients can subscribe to live updates (badge counts, toasts) with the
 * Firebase Realtime Database SDK. Also maintains an unread counter.
 *
 * All operations are best-effort: a missing/unconfigured RTDB never breaks the
 * primary Firestore write.
 */
import { realtimeDb } from './admin.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function pushNotification(userId: string, notification: any) {
  const db = realtimeDb();
  if (!db || !userId) return;
  try {
    await db.ref(`notifications/${userId}/${notification.id}`).set({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data ?? null,
      readAt: notification.readAt ?? null,
      createdAt: notification.createdAt instanceof Date ? notification.createdAt.toISOString() : notification.createdAt
    });
    await db.ref(`notificationMeta/${userId}/unread`).transaction((current) => (current || 0) + 1);
  } catch {
    /* best effort */
  }
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const db = realtimeDb();
  if (!db || !userId) return;
  try {
    await db.ref(`notifications/${userId}/${notificationId}/readAt`).set(new Date().toISOString());
    await db.ref(`notificationMeta/${userId}/unread`).transaction((current) => Math.max(0, (current || 0) - 1));
  } catch {
    /* best effort */
  }
}
