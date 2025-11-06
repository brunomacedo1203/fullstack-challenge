import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type Toast = { id: number; title?: string; message: string; type?: 'success' | 'error' | 'info' };

type ToastContextValue = {
  show: (
    message: string,
    opts?: { title?: string; type?: Toast['type']; timeoutMs?: number },
  ) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Toast[]>([]);

  const show = useCallback(
    (message: string, opts?: { title?: string; type?: Toast['type']; timeoutMs?: number }) => {
      const id = Date.now() + Math.random();
      const toast: Toast = { id, message, title: opts?.title, type: opts?.type ?? 'info' };
      setItems((prev) => [...prev, toast]);
      const timeout = opts?.timeoutMs ?? 3500;
      window.setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== id));
      }, timeout);
    },
    [],
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex w-80 flex-col gap-3">
        {items.map((t) => (
          <div
            key={t.id}
            className={
              'rounded-xl border-2 px-4 py-3 shadow-xl backdrop-blur-md transition-all duration-300 ' +
              (t.type === 'success'
                ? 'border-primary bg-gaming-light/90 text-foreground shadow-neon-green'
                : t.type === 'error'
                  ? 'border-red-500/50 bg-red-500/20 text-red-400'
                  : 'border-border bg-gaming-light/90 text-foreground')
            }
          >
            {t.title && <div className="font-gaming font-bold mb-1 text-primary">{t.title}</div>}
            <div className="text-sm font-medium">{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
