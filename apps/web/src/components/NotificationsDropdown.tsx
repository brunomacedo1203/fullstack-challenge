import React, { useEffect, useMemo, useRef, useState } from 'react';
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
        className="relative inline-flex items-center"
        aria-label="Notificações"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={18} className="text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-2 rounded-full bg-red-600 text-white text-[10px] px-1.5 py-0.5 leading-none">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-md border bg-white shadow">
          <div className="p-3 border-b flex items-center justify-between gap-2">
            <div className="font-medium">Notificações</div>
            {items.length > 0 && (
              <button
                className="text-xs text-blue-600 hover:underline"
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
              <div className="p-4 text-sm text-gray-600">Sem novas notificações.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {items.map((n) => (
                  <li key={n.id} className="p-3 hover:bg-gray-50">
                    <Link
                      to="/tasks/$id"
                      params={{ id: n.taskId }}
                      className="block"
                      onClick={async () => {
                        await markRead(n.id);
                        setOpen(false);
                      }}
                    >
                      <div className="text-sm font-medium">{n.title || 'Notificação'}</div>
                      {n.body && <div className="text-xs text-gray-600 line-clamp-2">{n.body}</div>}
                      <div className="text-[11px] text-gray-500 mt-1">
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
