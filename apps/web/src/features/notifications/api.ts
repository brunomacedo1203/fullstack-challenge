import { useAuthStore } from '../../features/auth/store';
import type { NotificationItem } from './types';

function getNotificationsHttpBase(): string {
  const envApi = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined; // e.g., http://...:3001/api
  if (typeof window !== 'undefined') {
    const proto = window.location.protocol;
    const host = window.location.hostname;
    if (envApi) {
      // If env points to docker-internal host, rewrite to current host
      if (envApi.includes('api-gateway') && host !== 'api-gateway') {
        return `${proto}//${host}:3001/api`;
      }
      return envApi.replace(/\/$/, '');
    }
    return `${proto}//${host}:3001/api`;
  }
  return (envApi && envApi.replace(/\/$/, '')) || 'http://localhost:3001/api';
}

export async function fetchUnreadNotifications(size = 10): Promise<NotificationItem[]> {
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken) return [];
  const base = getNotificationsHttpBase();
  const res = await fetch(`${base}/notifications?size=${size}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = (await res.json()) as { data?: any[] };
  const items = (body.data ?? []) as NotificationItem[];
  return items.map(normalizeNotification);
}

export async function markNotificationAsRead(
  id: string,
): Promise<{ id: string; readAt: string } | null> {
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken) return null;
  const base = getNotificationsHttpBase();
  const res = await fetch(`${base}/notifications/${id}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as { id: string; readAt: string };
}

export function normalizeNotification(n: any): NotificationItem {
  return {
    id: String(n.id),
    type: String(n.type ?? ''),
    taskId: String(n.taskId ?? n.task_id ?? ''),
    commentId: (n.commentId ?? n.comment_id ?? null) as string | null,
    title: String(n.title ?? ''),
    body: (n.body ?? null) as string | null,
    createdAt: String(n.createdAt ?? n.created_at ?? new Date().toISOString()),
    readAt: (n.readAt ?? n.read_at ?? null) as string | null,
  };
}
