import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-gaming-light/50 backdrop-blur-sm border-2 border-border rounded-2xl p-8 shadow-xl">
          <h1 className="text-3xl font-gaming font-bold text-primary mb-2 text-center">
            Criar conta
          </h1>
          <p className="text-foreground/70 text-sm text-center mb-8">Junte-se ao Jungle Tasks</p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="seu_usuario"
                required
                minLength={3}
                pattern="^[a-zA-Z0-9_\-]+$"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            {error && (
              <div className="bg-red-500/20 border-2 border-red-500/50 rounded-lg p-3">
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              size="lg"
              variant="secondary"
            >
              {loading ? 'Criando...' : 'Registrar'}
            </Button>
            <p className="text-sm text-foreground/70 text-center">
              Já tem conta?{' '}
              <Link
                to="/login"
                className="text-primary hover:text-accent font-semibold transition-colors"
              >
                Entrar
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
