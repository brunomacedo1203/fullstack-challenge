import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Task } from '../../tasks/types';
import { editTaskSchema, type EditTaskForm } from './editTaskForm';
import { taskToEditForm } from './mappers';

export function useEditTaskForm(task: Task | undefined) {
  const form = useForm<EditTaskForm>({
    resolver: zodResolver(editTaskSchema),
    values: useMemo<EditTaskForm | undefined>(() => {
      if (!task) return undefined;
      return taskToEditForm(task);
    }, [task]),
  });

  const assigneeInputValue = form.watch('assigneeIds') ?? '';

  return { ...form, assigneeInputValue } as const;
}
