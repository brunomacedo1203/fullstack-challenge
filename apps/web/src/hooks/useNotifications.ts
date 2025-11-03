import { useEffect, useRef } from 'react';
import { useAuthStore } from '../features/auth/store';
import { useToast } from '../components/ui/toast';

function getWsBaseUrl(): string {
  const env = (import.meta as any).env?.VITE_WS_URL as string | undefined;
  if (env) return env;
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:3004`;
  }
  return 'ws://localhost:3004';
}

export function useNotifications(): void {
  const accessToken = useAuthStore((s) => s.accessToken);
  const { show } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const hbRef = useRef<number | null>(null);
  const reconnectRef = useRef<number | null>(null);
  const attemptsRef = useRef(0);

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
      });

      socket.addEventListener('message', (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          const event = payload?.event as string | undefined;
          if (!event) return;
          switch (event) {
            case 'task:created':
              show('Nova tarefa criada', { type: 'info' });
              break;
            case 'task:updated':
              show('Tarefa atualizada', { type: 'info' });
              break;
            case 'comment:new':
              show('Novo comentário', { type: 'info' });
              break;
            case 'notification:unread':
              // initial sync item
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
