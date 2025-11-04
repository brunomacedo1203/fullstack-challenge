import { useAuthStore } from '../../features/auth/store';
import type { NotificationItem } from './types';

function getHttpBaseFromWs(wsUrl?: string): string {
  if (!wsUrl) return '';
  try {
    const u = new URL(wsUrl);
    const protocol = u.protocol === 'wss:' ? 'https:' : 'http:';
    return `${protocol}//${u.host}`;
  } catch {
    return '';
  }
}

function getNotificationsHttpBase(): string {
  const envWs = (import.meta as any).env?.VITE_WS_URL as string | undefined;
  const inferred = getHttpBaseFromWs(envWs);
  if (inferred) return inferred;
  if (typeof window !== 'undefined') {
    const proto = window.location.protocol;
    const host = window.location.hostname;
    return `${proto}//${host}:3004`;
  }
  return 'http://localhost:3004';
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
