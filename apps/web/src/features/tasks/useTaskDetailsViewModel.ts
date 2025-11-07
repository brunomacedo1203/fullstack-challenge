import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTask, listHistory } from './tasks.api';
import { listUsers } from '../users/users.api';
import { TaskKeys } from './queryKeys';
import { useAuthStore } from '../auth/store';

export function useTaskDetailsViewModel(id: string) {
  const currentUserId = useAuthStore((s) => s.user?.id ?? null);

  const {
    data: task,
    isLoading,
    isError,
  } = useQuery({
    queryKey: TaskKeys.byId(id),
    queryFn: () => getTask(id),
  });

  const {
    data: usersData,
    isLoading: isLoadingUsers,
    isError: isErrorUsers,
  } = useQuery({
    queryKey: TaskKeys.users,
    queryFn: listUsers,
    staleTime: 60_000,
  });

  const { data: historyData } = useQuery({
    queryKey: TaskKeys.history(id),
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

  return {
    task,
    isLoading,
    isError,
    usersData,
    isLoadingUsers,
    isErrorUsers,
    creatorId,
    canEdit,
    currentUserId,
  } as const;
}
