import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { register as registerApi } from './auth.api';
import { useAuthStore } from './store';
import type { RegisterFormValues } from './forms/registerForm';

export function useRegisterPage() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (values: RegisterFormValues) => {
    setError(null);
    setLoading(true);
    try {
      const tokens = await registerApi(values);
      setTokens(tokens.accessToken, tokens.refreshToken);
      navigate({ to: '/', replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Falha ao registrar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/', replace: true });
    }
  }, [isAuthenticated, navigate]);

  return { loading, error, submit } as const;
}
