import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import AssigneesPicker from './AssigneesPicker';
import type { UserSummary } from '../../features/users/users.api';
import type { CreateTaskInput } from '../../features/tasks/types';

const schema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(255),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  users: UserSummary[];
  currentUserId: string | null;
  isSubmitting?: boolean;
  onCancel: () => void;
  onCreate: (input: CreateTaskInput) => void;
};

export const CreateTaskForm: React.FC<Props> = ({
  users,
  currentUserId,
  isSubmitting = false,
  onCancel,
  onCreate,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  const assigneesIds = useMemo(() => selectedAssignees, [selectedAssignees]);

  const submit = (values: FormValues) => {
    const input: CreateTaskInput = {
      title: values.title,
      description: values.description || undefined,
      dueDate: values.dueDate || undefined,
      status: values.status,
      priority: values.priority,
      assigneeIds: assigneesIds.length ? assigneesIds : undefined,
    };
    onCreate(input);
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <option value="TODO">A fazer</option>
          <option value="IN_PROGRESS">Em andamento</option>
          <option value="REVIEW">Em revisão</option>
          <option value="DONE">Concluída</option>
        </Select>
      </div>
      <div>
        <Label>Prioridade</Label>
        <Select defaultValue="" {...register('priority')}>
          <option value="">—</option>
          <option value="LOW">Baixa</option>
          <option value="MEDIUM">Média</option>
          <option value="HIGH">Alta</option>
          <option value="URGENT">Urgente</option>
        </Select>
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="create-assignee-ids">Atribuir tarefa</Label>
        <AssigneesPicker
          users={users}
          valueIds={assigneesIds}
          onChange={setSelectedAssignees}
          excludeUserId={currentUserId}
          inputId="create-assignee-ids"
          placeholder="Selecione usuários"
        />
      </div>
      <div className="md:col-span-2 flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Criando...' : 'Criar'}
        </Button>
      </div>
    </form>
  );
};

export default CreateTaskForm;
