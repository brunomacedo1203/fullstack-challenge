import React from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useRegisterPage } from '../features/auth/useRegisterPage';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerFormSchema, type RegisterFormValues } from '../features/auth/forms/registerForm';

export const RegisterPage: React.FC = () => {
  const { loading, error, submit } = useRegisterPage();
  const {
    register: formRegister,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerFormSchema) });

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-gaming-light/50 backdrop-blur-sm border-2 border-border rounded-2xl p-8 shadow-xl">
          <h1 className="text-3xl font-gaming font-bold text-primary mb-2 text-center">
            Criar conta
          </h1>
          <p className="text-foreground/70 text-sm text-center mb-8">Junte-se ao Jungle Tasks</p>
          <form onSubmit={handleSubmit(submit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                {...formRegister('email')}
              />
              {errors.email && (
                <p className="text-sm text-red-400 mt-1 font-medium">
                  {errors.email.message as string}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" placeholder="seu_usuario" {...formRegister('username')} />
              {errors.username && (
                <p className="text-sm text-red-400 mt-1 font-medium">
                  {errors.username.message as string}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...formRegister('password')}
              />
              {errors.password && (
                <p className="text-sm text-red-400 mt-1 font-medium">
                  {errors.password.message as string}
                </p>
              )}
            </div>
            {error && (
              <div className="bg-red-500/20 border-2 border-red-500/50 rounded-lg p-3">
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>
            )}
            <Button
              type="submit"
              disabled={loading || isSubmitting}
              className="w-full"
              size="lg"
              variant="secondary"
            >
              {loading || isSubmitting ? 'Criando...' : 'Registrar'}
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
