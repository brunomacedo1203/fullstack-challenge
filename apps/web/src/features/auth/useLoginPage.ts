import React, { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { login } from './auth.api';
import { useAuthStore } from './store';
import type { LoginFormValues } from './forms/loginForm';

export function useLoginPage() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Novo: submissão tipada via react-hook-form + zod
  const submitValues = async (values: LoginFormValues) => {
    setError(null);
    setLoading(true);
    try {
      const tokens = await login(values);
      setTokens(tokens.accessToken, tokens.refreshToken);
      navigate({ to: '/', replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Falha ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/', replace: true });
    }
  }, [isAuthenticated, navigate]);

  return {
    loading,
    error,
    submitValues,
  } as const;
}
