import React, { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { login } from './auth.api';
import { useAuthStore } from './store';

export function useLoginPage() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const tokens = await login({ email, password });
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
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    handleSubmit,
  } as const;
}
