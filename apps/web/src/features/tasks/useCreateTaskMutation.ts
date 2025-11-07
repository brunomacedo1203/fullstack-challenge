import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTask } from './tasks.api';
import type { CreateTaskInput } from './types';
import { TaskKeys } from './queryKeys';
import { useToast } from '../../components/ui/toast';

export function useCreateTaskMutation() {
  const queryClient = useQueryClient();
  const { show } = useToast();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input),
    onSuccess: async () => {
      show('Tarefa criada com sucesso!', { type: 'success' });
      await queryClient.invalidateQueries({ queryKey: TaskKeys.all });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Falha ao criar tarefa';
      show(String(msg), { type: 'error' });
    },
  });
}
