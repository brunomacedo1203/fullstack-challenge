import React from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '../features/auth/store';
import { Button } from './ui/button';
import { NotificationsDropdown } from './NotificationsDropdown';

type HeaderProps = { isAuthenticated: boolean };

export const Header: React.FC<HeaderProps> = ({ isAuthenticated }) => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  // unread count handled by NotificationsDropdown store

  return (
    <header className="border-b border-border bg-gaming-dark/80 backdrop-blur-md supports-[backdrop-filter]:bg-gaming-dark/60 sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="font-gaming font-bold text-xl text-primary hover:text-accent transition-colors duration-300 text-glow"
        >
          Jungle Tasks
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            to="/tasks"
            className="text-sm font-medium text-foreground hover:text-primary transition-colors duration-300"
          >
            Tarefas
          </Link>
          {isAuthenticated && <NotificationsDropdown />}
          {!isAuthenticated ? (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors duration-300"
              >
                Login
              </Link>
              <Link to="/register">
                <Button variant="secondary" size="sm">
                  Registrar
                </Button>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-foreground">{user?.username}</span>
              <Button
                variant="outline"
                size="sm"
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
