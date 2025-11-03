import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../features/auth/store';

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

export function useUnreadCount(pollMs = 10000) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const enabled = !!accessToken;
  const base = getNotificationsHttpBase();

  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    enabled,
    refetchInterval: pollMs,
    queryFn: async () => {
      const res = await fetch(`${base}/notifications?size=10`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as { size?: number; data?: unknown[] };
      return body.size ?? (Array.isArray(body.data) ? body.data.length : 0);
    },
  });
}
