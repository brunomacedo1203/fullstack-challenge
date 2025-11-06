import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from './ui/input';
import type { UserSummary } from '../features/users/users.api';

export type AssigneesPickerProps = {
  users: UserSummary[];
  valueIds: string[];
  onChange: (ids: string[]) => void;
  excludeUserId?: string | null;
  inputId?: string;
  placeholder?: string;
  loading?: boolean;
  error?: boolean;
};

export const AssigneesPicker: React.FC<AssigneesPickerProps> = ({
  users,
  valueIds,
  onChange,
  excludeUserId,
  inputId,
  placeholder = 'Selecione usuários',
  loading = false,
  error = false,
}) => {
  const [open, setOpen] = useState(false);
  const blurTimeout = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (blurTimeout.current) window.clearTimeout(blurTimeout.current);
    };
  }, []);

  const availableUsers = useMemo(() => {
    return users.filter((u) => (excludeUserId ? u.id !== excludeUserId : true));
  }, [users, excludeUserId]);

  const usersById = useMemo(() => {
    const map = new Map<string, UserSummary>();
    for (const u of users) map.set(u.id, u);
    return map;
  }, [users]);

  const selected = useMemo(() => new Set(valueIds), [valueIds]);

  const display = useMemo(() => {
    return valueIds.map((id) => usersById.get(id)?.username ?? id).join(', ');
  }, [valueIds, usersById]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(Array.from(next));
  };

  const handleFocus = () => {
    if (blurTimeout.current) {
      window.clearTimeout(blurTimeout.current);
      blurTimeout.current = null;
    }
  };

  const handleBlur = () => {
    if (blurTimeout.current) window.clearTimeout(blurTimeout.current);
    blurTimeout.current = window.setTimeout(() => {
      setOpen(false);
      blurTimeout.current = null;
    }, 120);
  };

  return (
    <div className="relative">
      <Input
        id={inputId}
        placeholder={placeholder}
        value={display}
        readOnly
        onFocus={handleFocus}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            setOpen(false);
          }
        }}
        onBlur={handleBlur}
      />

      {open && (
        <div className="absolute z-20 mt-2 w-full max-h-60 overflow-y-auto rounded-lg border-2 border-border bg-gaming-light/95 p-3 shadow-xl">
          {loading && <p className="text-xs text-muted-foreground">Carregando usuários...</p>}
          {error && !loading && (
            <p className="text-xs text-red-400">Não foi possível carregar os usuários.</p>
          )}
          {!loading && !error && availableUsers.length === 0 && (
            <p className="text-xs text-muted-foreground">Nenhum usuário disponível.</p>
          )}
          {!loading && !error && availableUsers.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground mb-2">
                Clique para adicionar ou remover participantes.
              </p>
              <ul className="space-y-1">
                {availableUsers.map((user) => {
                  const isSelected = selected.has(user.id);
                  return (
                    <li key={user.id}>
                      <button
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          toggle(user.id);
                        }}
                        className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-xs transition-colors ${
                          isSelected
                            ? 'border-primary/60 bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/50 hover:bg-primary/5'
                        }`}
                      >
                        <span className="flex flex-col items-start truncate pr-3">
                          <span className="font-semibold text-foreground text-sm">
                            {user.username}
                          </span>
                          <span className="text-[11px] text-muted-foreground">{user.email}</span>
                        </span>
                        <span className="text-[11px] font-semibold uppercase">
                          {isSelected ? 'Remover' : 'Adicionar'}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}

      {selected.size > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {Array.from(selected).map((id) => {
            const user = usersById.get(id);
            const label = user?.username ?? id;
            return (
              <span
                key={id}
                className="flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary"
              >
                <span>{label}</span>
                <button
                  type="button"
                  className="rounded-full border border-primary/50 px-2 py-0.5 text-[10px] uppercase tracking-wide hover:bg-primary/20"
                  onClick={() => toggle(id)}
                >
                  Remover
                </button>
              </span>
            );
          })}
        </div>
      )}
      <p className="text-xs text-foreground/60 mt-1">Selecionado(s): {selected.size}</p>
    </div>
  );
};

export default AssigneesPicker;
