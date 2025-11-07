export const TaskKeys = {
  all: ['tasks'] as const,
  byId: (id: string) => ['task', id] as const,
  history: (id: string) => ['task-history-for-edit-gate', id] as const,
  users: ['users'] as const,
};
