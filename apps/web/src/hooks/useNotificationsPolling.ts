import { useEffect, useRef } from 'react';
import { useAuthStore } from '../features/auth/store';
import { useNotificationsStore } from '../features/notifications/store';

export function useNotificationsPolling(pollMs = 0): void {
  const accessToken = useAuthStore((s) => s.accessToken);
  const bootstrap = useNotificationsStore((s) => s.bootstrap);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!accessToken || !pollMs || pollMs <= 0) return;
    // immediate sync once
    bootstrap(10).catch(() => {});

    timerRef.current = window.setInterval(
      () => {
        bootstrap(10).catch(() => {});
      },
      Math.max(5000, pollMs),
    );

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [accessToken, pollMs, bootstrap]);
}
