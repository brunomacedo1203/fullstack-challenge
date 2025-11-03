import React from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '../features/auth/store';
import { Button } from './ui/button';
import { Bell } from 'lucide-react';
import { useUnreadCount } from '../hooks/useUnreadCount';

type HeaderProps = { isAuthenticated: boolean };

export const Header: React.FC<HeaderProps> = ({ isAuthenticated }) => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const { data: unreadCount } = useUnreadCount();

  return (
    <header className="border-b bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/40 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-semibold">
          Jungle Tasks
        </Link>
        <nav className="flex items-center gap-3">
          <Link to="/tasks" className="text-sm underline">
            Tarefas
          </Link>
          {isAuthenticated && (
            <div className="relative inline-flex items-center">
              <Bell size={18} className="text-gray-600" />
              {(unreadCount ?? 0) > 0 && (
                <span className="absolute -top-1 -right-2 rounded-full bg-red-600 text-white text-[10px] px-1.5 py-0.5 leading-none">
                  {unreadCount}
                </span>
              )}
            </div>
          )}
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
