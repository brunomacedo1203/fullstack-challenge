import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { useAuthStore } from '../features/auth/store';
import { Button } from './ui/button';
import { NotificationsDropdown } from './NotificationsDropdown';
import { Menu, X, LogOut } from 'lucide-react';

type HeaderProps = { isAuthenticated: boolean };

export const Header: React.FC<HeaderProps> = ({ isAuthenticated }) => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileAreaRef = useRef<HTMLDivElement | null>(null);

  // Pegar a rota atual para indicador visual
  const router = useRouterState();
  const currentPath = router.location.pathname;

  const handleLogout = () => {
    logout();
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate({ to: '/login', replace: true });
  };

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    if (!profileDropdownOpen) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      const el = profileAreaRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [profileDropdownOpen]);

  // Gerar iniciais do username para avatar
  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="border-b border-border bg-gaming-dark/80 backdrop-blur-md supports-[backdrop-filter]:bg-gaming-dark/60 sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="font-gaming font-bold text-xl text-primary hover:text-accent transition-colors duration-300 text-glow"
        >
          Jungle Tasks
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {/* Link Tarefas com indicador ativo */}
          {currentPath !== '/' && (
            <Link
              to="/tasks"
              className={`text-sm font-medium transition-colors duration-300 relative py-2 ${
                currentPath.startsWith('/tasks')
                  ? 'text-primary'
                  : 'text-foreground hover:text-primary'
              }`}
            >
              Tarefas
              {currentPath.startsWith('/tasks') && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          )}

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
            <div className="relative" ref={profileAreaRef}>
              {/* Avatar/Profile Button */}
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                {/* Avatar com iniciais */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-white shadow-lg">
                  {getInitials(user?.username)}
                </div>
                <span className="text-sm font-medium text-foreground hidden lg:inline">
                  {user?.username}
                </span>
              </button>

              {/* Dropdown do Perfil */}
              {profileDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl border-2 border-border bg-gaming-light/95 backdrop-blur-sm shadow-2xl z-50 overflow-hidden"
                  role="menu"
                  aria-label="Profile menu"
                >
                  {/* Header do dropdown */}
                  <div className="px-4 py-3 border-b border-border bg-gaming-dark/50">
                    <p className="text-sm font-semibold text-foreground">{user?.username}</p>
                    <p className="text-xs text-foreground/60">{user?.email || 'Usuário'}</p>
                  </div>

                  {/* Opções */}
                  <div className="py-2">{/* Removed profile button */}</div>

                  <div className="border-t border-border">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-3"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-foreground hover:text-primary transition-colors p-2"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-gaming-dark/95 backdrop-blur-md">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-3">
            {currentPath !== '/' && (
              <Link
                to="/tasks"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPath.startsWith('/tasks')
                    ? 'bg-primary/20 text-primary'
                    : 'text-foreground hover:bg-gaming-light/30'
                }`}
              >
                Tarefas
              </Link>
            )}

            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-gaming-light/30 transition-colors"
                >
                  Login
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="secondary" size="sm" className="w-full">
                    Registrar
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <div className="px-4 py-3 rounded-lg bg-gaming-light/20 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-white">
                      {getInitials(user?.username)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{user?.username}</p>
                      <p className="text-xs text-foreground/60">{user?.email || 'Usuário'}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-3 mt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors text-left flex items-center gap-3"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </div>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
