import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../features/auth/store';

function getApiBase(): string {
  const envApi = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined; // http://...:3001/api
  if (typeof window !== 'undefined') {
    const proto = window.location.protocol;
    const host = window.location.hostname;
    if (envApi) {
      if (envApi.includes('api-gateway') && host !== 'api-gateway') {
        return `${proto}//${host}:3001/api`;
      }
      return envApi.replace(/\/$/, '');
    }
    return `${proto}//${host}:3001/api`;
  }
  return (envApi && envApi.replace(/\/$/, '')) || 'http://localhost:3001/api';
}

export function useUnreadCount(pollMs?: number) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const enabled = !!accessToken;
  const base = getApiBase();

  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    enabled,
    refetchInterval: pollMs && pollMs > 0 ? pollMs : false,
    refetchOnWindowFocus: false,
    retry: false,
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
