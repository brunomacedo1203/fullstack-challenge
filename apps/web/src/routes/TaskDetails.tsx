import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams, useRouter } from '@tanstack/react-router';
import { getTask, updateTask } from '../features/tasks/tasks.api';
import type { UpdateTaskInput } from '../features/tasks/types';
import { Skeleton } from '../components/Skeleton';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '../components/ui/toast';
import { CommentsSection } from '../components/CommentsSection';
import { HistorySection } from '../components/HistorySection';
import ConfirmDialog from '../components/ConfirmDialog';
import AssigneesPicker from '../components/AssigneesPicker';
import { listHistory } from '../features/tasks/tasks.api';
import { listUsers, type UserSummary } from '../features/users/users.api';
import { useAuthStore } from '../features/auth/store';

const editTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  assigneeIds: z.string().optional(),
});
type EditTaskForm = z.infer<typeof editTaskSchema>;

export const TaskDetailsPage: React.FC = () => {
  const { id } = useParams({ from: '/tasks/$id' });
  const { show } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();

  const {
    data: task,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['task', id],
    queryFn: () => getTask(id),
  });

  const {
    data: usersData,
    isLoading: isLoadingUsers,
    isError: isErrorUsers,
  } = useQuery({
    queryKey: ['users'],
    queryFn: listUsers,
    staleTime: 60_000,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch,
    getValues,
  } = useForm<EditTaskForm>({
    resolver: zodResolver(editTaskSchema),
    values: useMemo<EditTaskForm | undefined>(() => {
      if (!task) return undefined;
      return {
        title: task.title,
        description: task.description ?? '',
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
        status: task.status,
        priority: task.priority,
        assigneeIds: task.assigneeIds.join(', '),
      };
    }, [task]),
  });

  const currentUserId = useAuthStore((state) => state.user?.id ?? null);
  const assigneeInputValue = watch('assigneeIds') ?? '';

  const parseCsv = (s: string): string[] =>
    s
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  const joinCsv = (ids: string[]) => ids.join(', ');

  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);

  // Resolve creator (front-only gating; backend enforcement still recommended)
  const { data: historyData } = useQuery({
    queryKey: ['task-history-for-edit-gate', id],
    queryFn: () => listHistory(id, { page: 1, size: 50 }),
    enabled: !!id,
    staleTime: 60_000,
  });

  const creatorId = useMemo(() => {
    const events = historyData?.data ?? [];
    let found: string | undefined;
    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i];
      if (e.type === 'TASK_CREATED' && e.actorId) {
        found = e.actorId;
      }
    }
    return found;
  }, [historyData]);

  const canEdit = useMemo(() => {
    if (!creatorId || !currentUserId) return true;
    return creatorId === currentUserId;
  }, [creatorId, currentUserId]);

  const saveMutation = useMutation({
    mutationFn: (values: EditTaskForm) => {
      const payload: UpdateTaskInput = {
        title: values.title,
        description: values.description || undefined,
        dueDate: values.dueDate || undefined,
        status: values.status,
        priority: values.priority,
        assigneeIds: values.assigneeIds
          ? values.assigneeIds
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      };
      return updateTask(id, payload);
    },
    onSuccess: async () => {
      show('Tarefa atualizada!', { type: 'success' });
      reset(getValues());
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['task', id] }),
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
      ]);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Não foi possível atualizar';
      show(String(msg), { type: 'error' });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (isError || !task) {
    return (
      <div className="p-4">
        <div className="bg-red-500/20 border-2 border-red-500/50 rounded-lg p-4 mb-4">
          <p className="text-red-400 font-medium">Erro ao carregar tarefa.</p>
        </div>
        <Link
          to="/tasks"
          className="text-primary hover:text-accent font-semibold transition-colors"
        >
          Voltar
        </Link>
      </div>
    );
  }

  // NOVO: Verificar se está atribuída ao usuário atual
  const isAssignedToMe = task.assigneeIds.includes(currentUserId || '');

  return (
    <div className="space-y-8 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-gaming font-bold text-primary mb-2">{task.title}</h1>
          {/* MELHORIA: Texto mais claro quando atribuída ao usuário */}
          <p className="text-sm text-foreground/60">
            Criada em {new Date(task.createdAt).toLocaleString('pt-BR')}
            {task.lastAssignedByUsername || task.lastAssignedById || task.lastAssignedAt ? (
              <>
                {' '}
                •{' '}
                {isAssignedToMe ? (
                  <span className="text-accent">
                    Atribuída a você por{' '}
                    {task.lastAssignedByUsername ??
                      (task.lastAssignedById ? task.lastAssignedById.slice(0, 8) : '—')}
                  </span>
                ) : (
                  <span>
                    Atribuída por{' '}
                    {task.lastAssignedByUsername ??
                      (task.lastAssignedById ? task.lastAssignedById.slice(0, 8) : '—')}
                  </span>
                )}
                {task.lastAssignedAt
                  ? ` em ${new Date(task.lastAssignedAt).toLocaleString('pt-BR')}`
                  : ''}
              </>
            ) : null}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (isDirty) {
                setConfirmLeaveOpen(true);
                return;
              }
              router.navigate({ to: '/tasks' });
            }}
          >
            Voltar
          </Button>
        </div>
      </div>

      <div className="bg-gaming-light/50 backdrop-blur-sm border-2 border-border rounded-xl p-6 shadow-xl">
        <h2 className="font-gaming font-bold text-xl text-primary mb-4">Editar Tarefa</h2>
        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          onSubmit={handleSubmit((values) => saveMutation.mutate(values))}
        >
          {!canEdit && (
            <div className="md:col-span-2 mb-2 rounded-md border border-yellow-500/40 bg-yellow-500/10 p-3 text-xs text-yellow-300">
              Somente o criador desta tarefa pode editar os campos abaixo. Você ainda pode comentar.
            </div>
          )}
          <div className="md:col-span-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" {...register('title')} disabled={!canEdit} />
            {errors.title && (
              <p className="text-sm text-red-400 mt-1 font-medium">{errors.title.message}</p>
            )}
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" rows={4} {...register('description')} disabled={!canEdit} />
          </div>
          <div>
            <Label htmlFor="dueDate">Data limite</Label>
            <Input id="dueDate" type="date" {...register('dueDate')} disabled={!canEdit} />
          </div>
          <div>
            <Label>Status</Label>
            <Select {...register('status')} defaultValue={task.status} disabled={!canEdit}>
              <option value="TODO">A fazer</option>
              <option value="IN_PROGRESS">Em andamento</option>
              <option value="REVIEW">Em revisão</option>
              <option value="DONE">Concluída</option>
            </Select>
          </div>
          <div>
            <Label>Prioridade</Label>
            <Select {...register('priority')} defaultValue={task.priority} disabled={!canEdit}>
              <option value="LOW">Baixa</option>
              <option value="MEDIUM">Média</option>
              <option value="HIGH">Alta</option>
              <option value="URGENT">Urgente</option>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="edit-assignee-ids">Atribuir tarefa</Label>
            <input type="hidden" {...register('assigneeIds')} />
            <AssigneesPicker
              users={usersData ?? []}
              valueIds={parseCsv(assigneeInputValue)}
              excludeUserId={currentUserId}
              inputId="edit-assignee-ids"
              placeholder="Selecione usuários"
              loading={isLoadingUsers}
              error={isErrorUsers}
              disabled={!canEdit}
              onChange={(ids) =>
                setValue('assigneeIds', joinCsv(ids), {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: false,
                })
              }
            />
          </div>
          <div className="md:col-span-2 flex justify-end gap-3">
            <Button
              type="submit"
              disabled={saveMutation.isPending || !isDirty || !canEdit}
              variant="secondary"
              size="lg"
            >
              {saveMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>
        </form>
      </div>

      <CommentsSection taskId={task.id} />

      <HistorySection taskId={task.id} />

      <ConfirmDialog
        open={confirmLeaveOpen}
        title="Descartar alterações?"
        description="Você tem alterações não salvas. Deseja descartá-las e voltar para a lista de tarefas?"
        cancelText="Permanecer aqui"
        confirmText="Descartar e voltar"
        onCancel={() => setConfirmLeaveOpen(false)}
        onConfirm={() => {
          setConfirmLeaveOpen(false);
          router.navigate({ to: '/tasks' });
        }}
      />
    </div>
  );
};
