import { useMemo, useState } from 'react';
import { useParams, useRouter, useSearch } from '@tanstack/react-router';
import { useTaskDetailsViewModel } from './useTaskDetailsViewModel';
import { useEditTaskForm } from './forms/useEditTaskForm';
import { useUpdateTaskMutation } from './useUpdateTaskMutation';
import { buildUpdatePayload } from './forms/mappers';
import type { EditTaskForm } from './forms/editTaskForm';

export function useTaskDetailsPage() {
  const { id } = useParams({ from: '/tasks/$id' });
  const router = useRouter();
  const search = useSearch({ from: '/tasks/$id' }) as { from?: 'home' | 'tasks' };

  const vm = useTaskDetailsViewModel(id);
  const form = useEditTaskForm(vm.task);

  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const saveMutation = useUpdateTaskMutation(id);

  const isAssignedToMe = useMemo(() => {
    if (!vm.task) return false;
    return vm.task.assigneeIds.includes(vm.currentUserId || '');
  }, [vm.task, vm.currentUserId]);

  const handleBack = () => {
    if (form.formState.isDirty) {
      setConfirmLeaveOpen(true);
      return;
    }
    const from = search?.from;
    if (from === 'tasks') {
      router.navigate({ to: '/tasks' });
      return;
    }
    // Default: voltar para a Home quando não veio da lista
    router.navigate({ to: '/' });
  };

  const onSubmit = (values: EditTaskForm) =>
    saveMutation.mutate(buildUpdatePayload(values), {
      onSuccess: () => form.reset(form.getValues()),
    });

  return {
    id,
    router,
    // view model
    ...vm,
    // form
    register: form.register,
    handleSubmit: form.handleSubmit,
    errors: form.formState.errors,
    isDirty: form.formState.isDirty,
    reset: form.reset,
    setValue: form.setValue,
    getValues: form.getValues,
    assigneeInputValue: form.assigneeInputValue,
    // page state + actions
    confirmLeaveOpen,
    setConfirmLeaveOpen,
    saveMutation,
    isAssignedToMe,
    handleBack,
    onSubmit,
  } as const;
}
