import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { listHistory } from '../features/tasks/tasks.api';
import type { UUID, TaskHistory } from '../features/tasks/types';
import { Skeleton } from './Skeleton';
import { Link } from '@tanstack/react-router';
import { listUsers, type UserSummary } from '../features/users/users.api';

type Props = {
  taskId: UUID;
};

function formatEvent(
  e: TaskHistory,
  usersById: Map<string, UserSummary>,
): { title: string; details?: string } {
  const actorLabel = e.actorId
    ? (usersById.get(e.actorId)?.username ?? e.actorId.slice(0, 8))
    : '—';
  const actor = `por ${actorLabel}`;
  if (e.type === 'TASK_CREATED') {
    return { title: `Tarefa criada ${actor}` };
  }
  if (e.type === 'COMMENT_CREATED') {
    const content = (e.payload?.content as string | undefined) ?? '';
    return { title: `Comentário adicionado ${actor}`, details: content };
  }
  if (e.type === 'TASK_UPDATED') {
    const changed = Object.keys((e.payload as Record<string, unknown>) ?? {});
    const pretty = changed
      .map((k) => (k === 'dueDate' ? 'data limite' : k === 'assigneeIds' ? 'assignees' : k))
      .join(', ');
    return { title: `Tarefa atualizada (${pretty || 'sem mudanças'}) ${actor}` };
  }
  return { title: e.type };
}

export const HistorySection: React.FC<Props> = ({ taskId }) => {
  const [page] = React.useState(1);
  const size = 10;

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ['history', { taskId, page, size }],
    queryFn: () => listHistory(taskId, { page, size }),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: listUsers,
    staleTime: 60_000,
  });

  const usersById = React.useMemo(() => {
    const m = new Map<string, UserSummary>();
    for (const u of usersData ?? []) m.set(u.id, u);
    return m;
  }, [usersData]);

  return (
    <div className="space-y-4">
      <h3 className="font-gaming font-bold text-xl text-primary">Histórico de alterações</h3>

      <div className="rounded-xl border-2 border-border bg-gaming-light/30 backdrop-blur-sm divide-y divide-border shadow-xl">
        {isLoading || isFetching ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4">
              <Skeleton className="h-4 w-64 mb-2" />
              <Skeleton className="h-3 w-40" />
            </div>
          ))
        ) : isError ? (
          <div className="p-4 text-sm text-red-400 font-medium">Erro ao carregar histórico.</div>
        ) : !data || data.data.length === 0 ? (
          <div className="p-4 text-sm text-foreground/70 text-center">Sem histórico ainda.</div>
        ) : (
          <ul>
            {data.data.map((h) => {
              const { title, details } = formatEvent(h, usersById);
              return (
                <li key={h.id} className="p-4 hover:bg-gaming-light/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-foreground">{title}</div>
                      {details && (
                        <div className="text-xs text-foreground/60 line-clamp-2 mt-1">
                          {details}
                        </div>
                      )}
                      <div className="text-[11px] text-foreground/50 mt-1">
                        {new Date(h.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {h.type === 'COMMENT_CREATED' && h.payload && (h.payload as any).commentId && (
                      <Link
                        to="/tasks/$id"
                        params={{ id: h.taskId }}
                        className="text-xs text-primary hover:text-accent font-semibold"
                      >
                        Ver tarefa
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
