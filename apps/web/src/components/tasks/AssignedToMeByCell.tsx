import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { listHistory } from '../../features/tasks/tasks.api';
import type { UUID, TaskHistory } from '../../features/tasks/types';
import type { UserSummary } from '../../features/users/users.api';

type Props = {
  taskId: UUID;
  currentUserId: UUID;
  usersById: Map<string, UserSummary>;
};

function resolveAssignerForMe(
  events: TaskHistory[],
  me: string,
): { actorId?: string; at?: string } | null {
  // listHistory returns newest first (DESC); find first event where "me" was added
  for (const e of events) {
    if (e.type === 'TASK_UPDATED') {
      const payload = (e.payload as any) ?? {};
      const assigneesChange = payload.assigneeIds as { from?: string[]; to?: string[] } | undefined;
      if (assigneesChange && Array.isArray(assigneesChange.to)) {
        const fromSet = new Set((assigneesChange.from as string[] | undefined) ?? []);
        const toSet = new Set(assigneesChange.to);
        // Added = to - from
        const added = Array.from(toSet).filter((id) => !fromSet.has(id));
        if (added.includes(me)) {
          return { actorId: e.actorId ?? undefined, at: e.createdAt };
        }
      }
    }
    if (e.type === 'TASK_CREATED') {
      const snapshot = (e.payload as any) ?? {};
      const assignees: string[] = Array.isArray(snapshot.assigneeIds) ? snapshot.assigneeIds : [];
      if (assignees.includes(me)) {
        return { actorId: e.actorId ?? undefined, at: e.createdAt };
      }
    }
  }
  return null;
}

export const AssignedToMeByCell: React.FC<Props> = ({ taskId, currentUserId, usersById }) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['assigned-to-me-by', taskId, currentUserId],
    queryFn: () => listHistory(taskId, { page: 1, size: 50 }),
    staleTime: 60_000,
    enabled: Boolean(taskId && currentUserId),
  });

  if (isLoading) return <span className="text-foreground/50">…</span>;
  if (isError || !data) return <span className="text-foreground/50">—</span>;

  const info = resolveAssignerForMe(data.data, currentUserId);
  if (!info) return <span className="text-foreground/50">—</span>;

  const label = info.actorId
    ? (usersById.get(info.actorId)?.username ?? info.actorId.slice(0, 8))
    : '—';
  return <span className="text-foreground/80">{label}</span>;
};

export default AssignedToMeByCell;
