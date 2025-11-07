import React from 'react';
import { Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useLoginPage } from '../features/auth/useLoginPage';
import { loginFormSchema, type LoginFormValues } from '../features/auth/forms/loginForm';

export const LoginPage: React.FC = () => {
  const { loading, error, submitValues } = useLoginPage();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginFormSchema) });

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-gaming-light/50 backdrop-blur-sm border-2 border-border rounded-2xl p-8 shadow-xl">
          <h1 className="text-3xl font-gaming font-bold text-primary mb-2 text-center">Entrar</h1>
          <p className="text-foreground/70 text-sm text-center mb-8">
            Acesse sua conta Jungle Tasks
          </p>
          <form onSubmit={handleSubmit(submitValues)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="seu@email.com" {...register('email')} />
              {errors.email && (
                <p className="text-sm text-red-400 mt-1 font-medium">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-red-400 mt-1 font-medium">{errors.password.message}</p>
              )}
            </div>
            {error && (
              <div className="bg-red-500/20 border-2 border-red-500/50 rounded-lg p-3">
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>
            )}
            <Button type="submit" disabled={loading || isSubmitting} className="w-full" size="lg">
              {loading || isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
            <p className="text-sm text-foreground/70 text-center">
              Não tem conta?{' '}
              <Link
                to="/register"
                className="text-primary hover:text-accent font-semibold transition-colors"
              >
                Registrar
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
