import { useEffect, useRef } from 'react';
import { useAuthStore } from '../features/auth/store';
import { useToast } from '../components/ui/toast';
import { useNotificationsStore } from '../features/notifications/store';

function getWsBaseUrl(): string {
  const env = (import.meta as any).env?.VITE_WS_URL as string | undefined;
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const hostname = window.location.hostname;
    // If env points to docker-internal hosts, rewrite to current host
    if (
      env &&
      /(notifications-service|api-gateway)/.test(env) &&
      hostname !== 'notifications-service'
    ) {
      return `${protocol}//${hostname}:3004`;
    }
    if (env) return env;
    return `${protocol}//${hostname}:3004`;
  }
  return env ?? 'ws://localhost:3004';
}

export function useNotifications(): void {
  const accessToken = useAuthStore((s) => s.accessToken);
  const { show } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const hbRef = useRef<number | null>(null);
  const reconnectRef = useRef<number | null>(null);
  const attemptsRef = useRef(0);
  const bootstrap = useNotificationsStore((s) => s.bootstrap);
  const addUnread = useNotificationsStore((s) => s.add);

  useEffect(() => {
    let stopped = false;

    const clearTimers = () => {
      if (hbRef.current) {
        window.clearInterval(hbRef.current);
        hbRef.current = null;
      }
      if (reconnectRef.current) {
        window.clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
    };

    const connect = () => {
      if (stopped || !accessToken) return;
      const base = getWsBaseUrl();
      const url = `${base.replace(/\/$/, '')}/ws?token=${encodeURIComponent(accessToken)}`;
      const socket = new WebSocket(url);
      wsRef.current = socket;

      socket.addEventListener('open', () => {
        attemptsRef.current = 0;
        // Heartbeat every 30s
        hbRef.current = window.setInterval(() => {
          try {
            socket.send('ping');
          } catch {}
        }, 30000);
        // Bootstrap unread on connect
        bootstrap(10).catch(() => {});
      });

      socket.addEventListener('message', (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          const event = payload?.event as string | undefined;
          const data = payload?.data;
          if (!event) return;
          switch (event) {
            case 'task:created':
              show('Nova tarefa criada', { type: 'info' });
              // refresh unread list to reflect new notification
              bootstrap(10).catch(() => {});
              break;
            case 'task:updated':
              show('Tarefa atualizada', { type: 'info' });
              bootstrap(10).catch(() => {});
              break;
            case 'comment:new':
              show('Novo comentário', { type: 'info' });
              bootstrap(10).catch(() => {});
              break;
            case 'notification:unread':
              // unread item pushed by server (on connect)
              if (data && typeof data === 'object') {
                addUnread(data);
              }
              break;
            default:
              break;
          }
        } catch {
          // ignore
        }
      });

      const scheduleReconnect = () => {
        clearTimers();
        wsRef.current = null;
        if (stopped) return;
        const attempt = attemptsRef.current++;
        const delay = Math.min(30000, 1000 * Math.pow(2, attempt));
        reconnectRef.current = window.setTimeout(connect, delay);
      };

      socket.addEventListener('close', scheduleReconnect);
      socket.addEventListener('error', scheduleReconnect);
    };

    if (accessToken) connect();

    return () => {
      stopped = true;
      clearTimers();
      try {
        wsRef.current?.close();
      } catch {}
      wsRef.current = null;
    };
  }, [accessToken, show]);
}
