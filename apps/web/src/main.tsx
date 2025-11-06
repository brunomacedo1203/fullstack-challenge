import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './components/ui/toast';
import './styles.css';
import { router } from './router';
import { useAuthStore } from './features/auth/store';
import { useNotifications } from './hooks/useNotifications';
import { useNotificationsPolling } from './hooks/useNotificationsPolling';

const rootEl = document.getElementById('root')!;

const queryClient = new QueryClient();

// Mount hooks that depend on providers under the providers
function NotificationsBootstrap() {
  // Initialize WS notifications when authenticated
  useNotifications();
  // Optional fallback polling (disabled by default). Enable via VITE_NOTIFS_POLL_MS
  const pollMs = Number((import.meta as any).env?.VITE_NOTIFS_POLL_MS ?? 0);
  useNotificationsPolling(Number.isFinite(pollMs) ? pollMs : 0);
  return null;
}

const Root = () => {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <NotificationsBootstrap />
        <RouterProvider router={router} context={{ isAuthenticated }} />
      </ToastProvider>
    </QueryClientProvider>
  );
};

createRoot(rootEl).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
