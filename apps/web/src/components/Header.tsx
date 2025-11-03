import React from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '../features/auth/store';
import { Button } from './ui/button';

type HeaderProps = { isAuthenticated: boolean };

export const Header: React.FC<HeaderProps> = ({ isAuthenticated }) => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  return (
    <header className="border-b bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/40 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-semibold">
          Jungle Tasks
        </Link>
        <nav className="flex items-center gap-3">
          {!isAuthenticated ? (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Registrar</Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">{user?.username}</span>
              <Button
                variant="outline"
                onClick={() => {
                  logout();
                  navigate({ to: '/login', replace: true });
                }}
              >
                Sair
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
