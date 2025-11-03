import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Button } from '../components/ui/button';
import { register } from '../features/auth/auth.api';
import { useAuthStore } from '../features/auth/store';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const tokens = await register({ email, username, password });
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

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-semibold mb-6">Criar conta</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">E-mail</label>
          <input
            type="email"
            className="w-full rounded border px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Username</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            pattern="^[a-zA-Z0-9_\-]+$"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Senha</label>
          <input
            type="password"
            className="w-full rounded border px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Criando...' : 'Registrar'}
        </Button>
        <p className="text-sm text-gray-600">
          Já tem conta?{' '}
          <Link to="/login" className="underline">
            Entrar
          </Link>
        </p>
      </form>
    </div>
  );
};
