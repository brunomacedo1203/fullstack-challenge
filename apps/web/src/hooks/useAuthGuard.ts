import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '../features/auth/store';

export function useAuthGuard(redirectTo: string = '/login') {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: redirectTo, replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo]);

  return isAuthenticated;
}
