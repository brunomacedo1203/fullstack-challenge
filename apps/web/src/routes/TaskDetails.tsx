import React, { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams, useRouter } from '@tanstack/react-router';
import { deleteTask, getTask, updateTask } from '../features/tasks/tasks.api';
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
    register,
    handleSubmit,
    formState: { errors },
    reset,
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

  const deleteMutation = useMutation({
    mutationFn: () => deleteTask(id),
    onSuccess: async () => {
      show('Tarefa excluída', { type: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      router.navigate({ to: '/tasks' });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Falha ao excluir';
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

  return (
    <div className="space-y-8 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-gaming font-bold text-primary mb-2">{task.title}</h1>
          <p className="text-sm text-foreground/60">
            Criada em {new Date(task.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              reset();
              show('Campos resetados', { type: 'info' });
            }}
          >
            Resetar
          </Button>
          <Button
            variant="outline"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
          </Button>
        </div>
      </div>

      <div className="bg-gaming-light/50 backdrop-blur-sm border-2 border-border rounded-xl p-6 shadow-xl">
        <h2 className="font-gaming font-bold text-xl text-primary mb-4">Editar Tarefa</h2>
        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          onSubmit={handleSubmit((values) => saveMutation.mutate(values))}
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
            <Textarea id="description" rows={4} {...register('description')} />
          </div>
          <div>
            <Label htmlFor="dueDate">Data limite (YYYY-MM-DD)</Label>
            <Input id="dueDate" {...register('dueDate')} />
          </div>
          <div>
            <Label>Status</Label>
            <Select {...register('status')} defaultValue={task.status}>
              <option value="TODO">TODO</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="REVIEW">REVIEW</option>
              <option value="DONE">DONE</option>
            </Select>
          </div>
          <div>
            <Label>Prioridade</Label>
            <Select {...register('priority')} defaultValue={task.priority}>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="URGENT">URGENT</option>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>Assignees (IDs separados por vírgula)</Label>
            <Input {...register('assigneeIds')} />
            <p className="text-xs text-foreground/60 mt-1">
              Atual: {task.assigneeIds.length} atribuído(s).
            </p>
          </div>
          <div className="md:col-span-2 flex justify-end gap-3">
            <Button type="submit" disabled={saveMutation.isPending} variant="secondary">
              {saveMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>
        </form>
      </div>

      <CommentsSection taskId={task.id} />

      <HistorySection taskId={task.id} />
    </div>
  );
};
