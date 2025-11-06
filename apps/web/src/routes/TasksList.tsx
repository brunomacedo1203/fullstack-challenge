import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient, useMutation, keepPreviousData } from '@tanstack/react-query';
import { listTasks, createTask } from '../features/tasks/tasks.api';
import type { Task, CreateTaskInput } from '../features/tasks/types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Skeleton } from '../components/Skeleton';
import { Link } from '@tanstack/react-router';
import TasksFilters from '../components/tasks/TasksFilters';
import CreateTaskForm from '../components/tasks/CreateTaskForm';
import { useToast } from '../components/ui/toast';
import { useAuthStore } from '../features/auth/store';
import { listUsers } from '../features/users/users.api';
import AssigneesPicker from '../components/AssigneesPicker';

export const TasksListPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();
  const { show } = useToast();

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['tasks', { page, size }],
    queryFn: () => listTasks({ page, size }),
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });

  const tasks = data?.data ?? [];

  const {
    data: usersData,
    isLoading: isLoadingUsers,
    isError: isErrorUsers,
  } = useQuery({
    queryKey: ['users'],
    queryFn: listUsers,
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    let list: Task[] = tasks;
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      list = list.filter(
        (t) => t.title.toLowerCase().includes(s) || (t.description ?? '').toLowerCase().includes(s),
      );
    }
    if (statusFilter) list = list.filter((t) => t.status === statusFilter);
    if (priorityFilter) list = list.filter((t) => t.priority === priorityFilter);
    return list;
  }, [tasks, search, statusFilter, priorityFilter]);

  const createMutation = useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input),
    onSuccess: async () => {
      show('Tarefa criada com sucesso!', { type: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      refetch();
      setShowCreate(false);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Falha ao criar tarefa';
      show(String(msg), { type: 'error' });
    },
  });
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);

  return (
    <div className="space-y-6 p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-gaming font-bold text-primary">Tarefas</h1>
        <Button onClick={() => setShowCreate((v) => !v)} variant="secondary">
          {showCreate ? 'Fechar' : 'Nova Tarefa'}
        </Button>
      </div>

      {showCreate && (
        <div className="rounded-xl border-2 border-border bg-gaming-light/50 backdrop-blur-sm p-6 shadow-xl">
          <h2 className="font-gaming font-bold text-xl text-primary mb-4">Criar nova tarefa</h2>
          <CreateTaskForm
            users={usersData ?? []}
            currentUserId={currentUserId}
            isSubmitting={createMutation.isPending}
            onCancel={() => setShowCreate(false)}
            onCreate={(input) => createMutation.mutate(input)}
          />
        </div>
      )}

      <TasksFilters
        search={search}
        onSearchChange={setSearch}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        priority={priorityFilter}
        onPriorityChange={setPriorityFilter}
      />

      <div className="overflow-x-auto rounded-xl border-2 border-border bg-gaming-light/30 backdrop-blur-sm shadow-xl">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-gaming-light/80">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-gaming font-bold uppercase tracking-wider text-primary">
                Título
              </th>
              <th className="px-4 py-3 text-left text-xs font-gaming font-bold uppercase tracking-wider text-primary">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-gaming font-bold uppercase tracking-wider text-primary">
                Prioridade
              </th>
              <th className="px-4 py-3 text-left text-xs font-gaming font-bold uppercase tracking-wider text-primary">
                Vencimento
              </th>
              <th className="px-4 py-3 text-center text-xs font-gaming font-bold uppercase tracking-wider text-primary">
                Responsáveis
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-gaming-dark/50">
            {isLoading || isFetching ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-40" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-20" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-20" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-12" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Skeleton className="h-8 w-20 ml-auto" />
                  </td>
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td className="px-4 py-6 text-sm text-red-400 font-medium" colSpan={6}>
                  Erro ao carregar tarefas.
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-sm text-foreground/70" colSpan={6}>
                  Nenhuma tarefa encontrada.
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr key={t.id} className="hover:bg-gaming-light/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      to="/tasks/$id"
                      params={{ id: t.id }}
                      className="font-semibold text-primary hover:text-accent transition-colors"
                    >
                      {t.title}
                    </Link>
                    {t.description && (
                      <div className="text-xs text-foreground/60 line-clamp-1 mt-1">
                        {t.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-base font-medium text-foreground">{t.status}</td>
                  <td className="px-4 py-3 text-base font-medium text-foreground">{t.priority}</td>
                  <td className="px-4 py-3 text-base text-foreground/80">
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-base text-foreground/80 text-center">
                    {t.assigneeIds.length}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to="/tasks/$id" params={{ id: t.id }}>
                      <Button variant="outline" size="sm">
                        Detalhes
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-foreground/70 font-medium">
          Página {(data as any)?.page ?? page} de{' '}
          {data
            ? Math.max(1, Math.ceil(((data as any).total ?? 0) / ((data as any).size ?? 10)))
            : 1}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            disabled={!!data && page >= Math.ceil((data as any).total / (data as any).size)}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
};
