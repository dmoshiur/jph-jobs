import { prisma } from '../../database/prisma.js';
import { pushNotification, markNotificationRead } from '../../firebase/realtime.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface NotificationInput {
  userId: string;
  type: 'SYSTEM' | 'APPLICATION' | 'PAYMENT' | 'JOB' | 'COMPANY' | 'ALERT' | 'ADMIN';
  title: string;
  body: string;
  data?: unknown;
}

/** Create one notification in Firestore and mirror it to the Realtime Database. */
export async function createNotification(input: NotificationInput) {
  const notification = await prisma.notification.create({ data: input as any });
  await pushNotification(input.userId, notification);
  return notification;
}

/** Create many notifications, mirroring each to the Realtime Database. */
export async function createNotifications(inputs: NotificationInput[]) {
  const results = [];
  for (const input of inputs) {
    results.push(await createNotification(input));
  }
  return { count: results.length };
}

export async function markRead(userId: string, notificationId: string) {
  const result = await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { readAt: new Date() }
  });
  await markNotificationRead(userId, notificationId);
  return result;
}
