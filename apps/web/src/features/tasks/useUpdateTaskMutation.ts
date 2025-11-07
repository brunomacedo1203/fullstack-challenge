import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTask } from './tasks.api';
import type { UpdateTaskInput } from './types';
import { TaskKeys } from './queryKeys';
import { useToast } from '../../components/ui/toast';

export function useUpdateTaskMutation(id: string) {
  const queryClient = useQueryClient();
  const { show } = useToast();

  return useMutation({
    mutationFn: (payload: UpdateTaskInput) => updateTask(id, payload),
    onSuccess: async () => {
      show('Tarefa atualizada!', { type: 'success' });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: TaskKeys.byId(id) }),
        queryClient.invalidateQueries({ queryKey: TaskKeys.all }),
      ]);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Não foi possível atualizar';
      show(String(msg), { type: 'error' });
    },
  });
}
