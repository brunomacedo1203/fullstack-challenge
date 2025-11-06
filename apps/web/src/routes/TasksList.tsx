import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient, useMutation, keepPreviousData } from '@tanstack/react-query';
import { listTasks, createTask } from '../features/tasks/tasks.api';
import type { Task } from '../features/tasks/types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Skeleton } from '../components/Skeleton';
import { Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '../components/ui/toast';
import { useAuthStore } from '../features/auth/store';
import { listUsers, type UserSummary } from '../features/users/users.api';

const createTaskSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(255),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assigneeIds: z.string().optional(), // comma-separated
});
type CreateTaskForm = z.infer<typeof createTaskSchema>;

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
    mutationFn: (input: CreateTaskForm) => {
      const assigneeIds = input.assigneeIds
        ? input.assigneeIds
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;
      return createTask({
        title: input.title,
        description: input.description || undefined,
        dueDate: input.dueDate || undefined,
        priority: input.priority as any,
        status: input.status as any,
        assigneeIds,
      });
    },
    onSuccess: async () => {
      show('Tarefa criada com sucesso!', { type: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      refetch();
      setShowCreate(false);
      reset();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Falha ao criar tarefa';
      show(String(msg), { type: 'error' });
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CreateTaskForm>({ resolver: zodResolver(createTaskSchema) });

  const currentUserId = useAuthStore((state) => state.user?.id ?? null);
  const assigneeInputValue = watch('assigneeIds') ?? '';
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
  const assigneeBlurTimeout = useRef<number | null>(null);

  const availableUsers: UserSummary[] = useMemo(() => {
    if (!usersData) return [];
    return usersData.filter((user) => (currentUserId ? user.id !== currentUserId : true));
  }, [usersData, currentUserId]);

  const usersById = useMemo(() => {
    const map = new Map<string, UserSummary>();
    for (const user of usersData ?? []) {
      map.set(user.id, user);
    }
    return map;
  }, [usersData]);

  const selectedAssigneeIds = useMemo(() => {
    return new Set(
      assigneeInputValue
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    );
  }, [assigneeInputValue]);

  const toggleAssignee = (id: string) => {
    const next = new Set(selectedAssigneeIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    const value = Array.from(next).join(', ');
    setValue('assigneeIds', value, { shouldDirty: true, shouldTouch: true, shouldValidate: false });
  };

  const handleAssigneeFocus = () => {
    if (assigneeBlurTimeout.current) {
      window.clearTimeout(assigneeBlurTimeout.current);
      assigneeBlurTimeout.current = null;
    }
  };

  const toggleAssigneeDropdown = () => {
    if (assigneeBlurTimeout.current) {
      window.clearTimeout(assigneeBlurTimeout.current);
      assigneeBlurTimeout.current = null;
    }
    setAssigneeDropdownOpen((v) => !v);
  };

  const handleAssigneeBlur = () => {
    if (assigneeBlurTimeout.current) {
      window.clearTimeout(assigneeBlurTimeout.current);
    }
    assigneeBlurTimeout.current = window.setTimeout(() => {
      setAssigneeDropdownOpen(false);
      assigneeBlurTimeout.current = null;
    }, 120);
  };

  useEffect(() => {
    return () => {
      if (assigneeBlurTimeout.current) {
        window.clearTimeout(assigneeBlurTimeout.current);
      }
    };
  }, []);

  const assigneeField = register('assigneeIds');
  const assigneeDisplay = useMemo(() => {
    return Array.from(selectedAssigneeIds)
      .map((id) => usersById.get(id)?.username ?? id)
      .join(', ');
  }, [selectedAssigneeIds, usersById]);

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-gaming font-bold text-primary">Tarefas</h1>
        <Button onClick={() => setShowCreate((v) => !v)} variant="secondary">
          {showCreate ? 'Fechar' : 'Nova Tarefa'}
        </Button>
      </div>

      {showCreate && (
        <div className="rounded-xl border-2 border-border bg-gaming-light/50 backdrop-blur-sm p-6 shadow-xl">
          <h2 className="font-gaming font-bold text-xl text-primary mb-4">Criar nova tarefa</h2>
          <form
            onSubmit={handleSubmit((values) => createMutation.mutate(values))}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="md:col-span-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" {...register('title')} />
              {errors.title && (
                <p className="text-sm text-red-400 mt-1 font-medium">{errors.title.message}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" rows={3} {...register('description')} />
            </div>
            <div>
              <Label htmlFor="dueDate">Data limite (YYYY-MM-DD)</Label>
              <Input id="dueDate" placeholder="2025-11-20" {...register('dueDate')} />
            </div>
            <div>
              <Label>Status</Label>
              <Select defaultValue="" {...register('status')}>
                <option value="">—</option>
                <option value="TODO">TODO</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="REVIEW">REVIEW</option>
                <option value="DONE">DONE</option>
              </Select>
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select defaultValue="" {...register('priority')}>
                <option value="">—</option>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="create-assignee-ids">Atribuir tarefa</Label>
              <div className="relative">
                <input type="hidden" {...assigneeField} />
                <Input
                  id="create-assignee-ids"
                  placeholder="Selecione usuários"
                  value={assigneeDisplay}
                  readOnly
                  onFocus={() => {
                    handleAssigneeFocus();
                  }}
                  onClick={() => {
                    toggleAssigneeDropdown();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'ArrowDown') {
                      e.preventDefault();
                      setAssigneeDropdownOpen(true);
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      setAssigneeDropdownOpen(false);
                    }
                  }}
                  onBlur={() => {
                    handleAssigneeBlur();
                  }}
                />
                {assigneeDropdownOpen && (
                  <div className="absolute z-20 mt-2 w-full max-h-60 overflow-y-auto rounded-lg border-2 border-border bg-gaming-light/95 p-3 shadow-xl">
                    {isLoadingUsers && (
                      <p className="text-xs text-muted-foreground">Carregando usuários...</p>
                    )}
                    {isErrorUsers && !isLoadingUsers && (
                      <p className="text-xs text-red-400">
                        Não foi possível carregar os usuários. Tente novamente mais tarde.
                      </p>
                    )}
                    {!isLoadingUsers && !isErrorUsers && availableUsers.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Nenhum outro usuário encontrado para atribuição.
                      </p>
                    )}
                    {!isLoadingUsers && !isErrorUsers && availableUsers.length > 0 && (
                      <>
                        <p className="text-xs text-muted-foreground mb-2">
                          Clique para adicionar ou remover participantes.
                        </p>
                        <ul className="space-y-1">
                          {availableUsers.map((user) => {
                            const selected = selectedAssigneeIds.has(user.id);
                            return (
                              <li key={user.id}>
                                <button
                                  type="button"
                                  onMouseDown={(event) => {
                                    event.preventDefault();
                                    toggleAssignee(user.id);
                                  }}
                                  className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-xs transition-colors ${
                                    selected
                                      ? 'border-primary/60 bg-primary/10 text-primary'
                                      : 'border-border hover:border-primary/50 hover:bg-primary/5'
                                  }`}
                                >
                                  <span className="flex flex-col items-start truncate pr-3">
                                    <span className="font-semibold text-foreground text-sm">
                                      {user.username}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground">
                                      {user.email}
                                    </span>
                                  </span>
                                  <span className="text-[11px] font-semibold uppercase">
                                    {selected ? 'Remover' : 'Adicionar'}
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
              </div>
              {selectedAssigneeIds.size > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {Array.from(selectedAssigneeIds).map((id) => {
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
                          onClick={() => toggleAssignee(id)}
                        >
                          Remover
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-foreground/60 mt-1">
                Selecionado(s): {selectedAssigneeIds.size}
              </p>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Criando...' : 'Criar'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-1">
          <Label>Buscar</Label>
          <Input
            placeholder="Título ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Todos</option>
            <option value="TODO">TODO</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="REVIEW">REVIEW</option>
            <option value="DONE">DONE</option>
          </Select>
        </div>
        <div>
          <Label>Prioridade</Label>
          <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="">Todas</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="URGENT">URGENT</option>
          </Select>
        </div>
      </div>

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
              <th className="px-4 py-3 text-left text-xs font-gaming font-bold uppercase tracking-wider text-primary">
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
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{t.status}</td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{t.priority}</td>
                  <td className="px-4 py-3 text-sm text-foreground/80">
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground/80">{t.assigneeIds.length}</td>
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
