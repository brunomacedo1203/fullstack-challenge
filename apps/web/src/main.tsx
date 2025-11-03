import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import './styles.css';
import { router } from './router';
import { useAuthStore } from './features/auth/store';

const rootEl = document.getElementById('root')!;

const Root = () => {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);
  return <RouterProvider router={router} context={{ isAuthenticated }} />;
};

createRoot(rootEl).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
