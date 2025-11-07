import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { listTasks } from './tasks.api';
import { listUsers, type UserSummary } from '../users/users.api';
import type { Task } from './types';
import { useAuthStore } from '../auth/store';
import { useCreateTaskMutation } from './useCreateTaskMutation';

export function useTasksListPage() {
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['tasks', { page, size }],
    queryFn: () => listTasks({ page, size }),
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });

  const tasks = (data?.data ?? []) as Task[];

  const {
    data: usersData,
    isLoading: isLoadingUsers,
    isError: isErrorUsers,
  } = useQuery({
    queryKey: ['users'],
    queryFn: listUsers,
    staleTime: 60_000,
  });

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

  const usersById = useMemo(() => {
    const m = new Map<string, UserSummary>();
    for (const u of usersData ?? []) m.set(u.id, u);
    return m;
  }, [usersData]);

  const createMutation = useCreateTaskMutation();
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);

  const handleCreate = (input: Parameters<typeof createMutation.mutate>[0]) =>
    createMutation.mutate(input, {
      onSuccess: async () => {
        // base hook already shows toast + invalidates; here we just close and optionally refetch
        setShowCreate(false);
        await refetch();
      },
    });

  return {
    page,
    setPage,
    size,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    showCreate,
    setShowCreate,
    data,
    isLoading,
    isError,
    isFetching,
    tasks,
    usersData,
    isLoadingUsers,
    isErrorUsers,
    filtered,
    usersById,
    createMutation,
    handleCreate,
    currentUserId,
  } as const;
}
