import React, { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useNotificationsStore } from '../features/notifications/store';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export const NotificationsDropdown: React.FC = () => {
  const [open, setOpen] = useState(false);
  const items = useNotificationsStore((s) => s.items);
  const bootstrap = useNotificationsStore((s) => s.bootstrap);
  const markRead = useNotificationsStore((s) => s.markRead);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const initialized = useNotificationsStore((s) => s.initialized);
  const unreadCount = items.length;
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClickAway = (ev: MouseEvent) => {
      if (!ref.current) return;
      if (ev.target instanceof Node && ref.current.contains(ev.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, []);

  useEffect(() => {
    if (open && !initialized) {
      bootstrap(10).catch(() => {});
    }
  }, [open, initialized, bootstrap]);

  return (
    <div className="relative" ref={ref}>
      <button
        className="relative inline-flex items-center p-2 rounded-lg hover:bg-gaming-light transition-colors"
        aria-label="Notificações"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={20} className="text-foreground hover:text-primary transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-2 rounded-full bg-secondary text-white text-[10px] font-bold px-1.5 py-0.5 leading-none shadow-neon-orange">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border-2 border-border bg-gaming-light/95 backdrop-blur-md shadow-xl">
          <div className="p-4 border-b border-border flex items-center justify-between gap-2">
            <div className="font-gaming font-bold text-primary">Notificações</div>
            {items.length > 0 && (
              <button
                className="text-xs text-primary hover:text-accent font-semibold transition-colors"
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  await markAllRead();
                }}
              >
                Marcar todas como lidas
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-4 text-sm text-foreground/70 text-center">
                Sem novas notificações.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((n) => (
                  <li key={n.id} className="p-3 hover:bg-gaming-dark/50 transition-colors">
                    <Link
                      to="/tasks/$id"
                      params={{ id: n.taskId }}
                      className="block"
                      onClick={async () => {
                        await markRead(n.id);
                        setOpen(false);
                      }}
                    >
                      <div className="text-sm font-semibold text-foreground">
                        {n.title || 'Notificação'}
                      </div>
                      {n.body && (
                        <div className="text-xs text-foreground/60 line-clamp-2 mt-1">{n.body}</div>
                      )}
                      <div className="text-[11px] text-foreground/50 mt-1">
                        {formatDate(n.createdAt)}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
