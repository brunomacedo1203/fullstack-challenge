import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './components/ui/toast';
import './styles.css';
import { router } from './router';
import { useAuthStore } from './features/auth/store';
import { useNotifications } from './hooks/useNotifications';

const rootEl = document.getElementById('root')!;

const queryClient = new QueryClient();

const Root = () => {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);
  // Initialize WS notifications when authenticated
  useNotifications();
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
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
