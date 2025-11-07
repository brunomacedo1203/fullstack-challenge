import React from 'react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import AssigneesPicker from './AssigneesPicker';
import type {
  UseFormHandleSubmit,
  UseFormRegister,
  FieldErrors,
  UseFormSetValue,
} from 'react-hook-form';
import type { EditTaskForm } from '../../features/tasks/forms/editTaskForm';
import type { UserSummary } from '../../features/users/users.api';
import type { Task } from '../../features/tasks/types';
import { parseCsv, joinCsv } from '../../lib/csv';

type Props = {
  task: Task;
  canEdit: boolean;
  users: UserSummary[] | undefined;
  isLoadingUsers: boolean;
  isErrorUsers: boolean;
  currentUserId: string | null;
  register: UseFormRegister<EditTaskForm>;
  handleSubmit: UseFormHandleSubmit<EditTaskForm>;
  errors: FieldErrors<EditTaskForm>;
  isDirty: boolean;
  setValue: UseFormSetValue<EditTaskForm>;
  assigneeInputValue: string;
  onSubmit: (values: EditTaskForm) => void;
  isSubmitting: boolean;
};

export const TaskEditForm: React.FC<Props> = ({
  task,
  canEdit,
  users,
  isLoadingUsers,
  isErrorUsers,
  currentUserId,
  register,
  handleSubmit,
  errors,
  isDirty,
  setValue,
  assigneeInputValue,
  onSubmit,
  isSubmitting,
}) => {
  return (
    <div className="bg-gaming-light/50 backdrop-blur-sm border-2 border-border rounded-xl p-6 shadow-xl">
      <h2 className="font-gaming font-bold text-xl text-primary mb-4">Editar Tarefa</h2>
      <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit(onSubmit)}>
        {!canEdit && (
          <div className="md:col-span-2 mb-2 rounded-md border border-yellow-500/40 bg-yellow-500/10 p-3 text-xs text-yellow-300">
            Somente o criador desta tarefa pode editar os campos abaixo. Você ainda pode comentar.
          </div>
        )}
        <div className="md:col-span-2">
          <Label htmlFor="title">Título</Label>
          <Input id="title" {...register('title')} disabled={!canEdit} />
          {errors.title && (
            <p className="text-sm text-red-400 mt-1 font-medium">
              {errors.title.message as string}
            </p>
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
            users={users ?? []}
            valueIds={parseCsv(assigneeInputValue)}
            excludeUserId={currentUserId ?? undefined}
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
            disabled={isSubmitting || !isDirty || !canEdit}
            variant="secondary"
            size="lg"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </div>
      </form>
    </div>
  );
};
