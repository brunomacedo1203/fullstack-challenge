import React, { useMemo, useState } from 'react';
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
  } = useForm<CreateTaskForm>({ resolver: zodResolver(createTaskSchema) });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tarefas</h1>
        <Button onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? 'Fechar' : 'Nova Tarefa'}
        </Button>
      </div>

      {showCreate && (
        <div className="rounded-md border p-4">
          <h2 className="font-medium mb-3">Criar nova tarefa</h2>
          <form
            onSubmit={handleSubmit((values) => createMutation.mutate(values))}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="md:col-span-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" {...register('title')} />
              {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
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
              <Label>Assignees (IDs separados por vírgula)</Label>
              <Input placeholder="uuid-1, uuid-2" {...register('assigneeIds')} />
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

      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Título
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Prioridade
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Vencimento
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Assignees
              </th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
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
                <td className="px-4 py-6 text-sm text-red-600" colSpan={6}>
                  Erro ao carregar tarefas.
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-sm text-gray-600" colSpan={6}>
                  Nenhuma tarefa encontrada.
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to="/tasks/$id" params={{ id: t.id }} className="font-medium underline">
                      {t.title}
                    </Link>
                    {t.description && (
                      <div className="text-xs text-gray-500 line-clamp-1">{t.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">{t.status}</td>
                  <td className="px-4 py-3 text-sm">{t.priority}</td>
                  <td className="px-4 py-3 text-sm">
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm">{t.assigneeIds.length}</td>
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
        <div className="text-sm text-gray-600">
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
