import api from '../../lib/api';
import type {
  Paginated,
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  Comment,
  CreateCommentInput,
  UUID,
  TaskHistory,
} from './types';

export async function listTasks(
  params: { page?: number; size?: number } = {},
): Promise<Paginated<Task>> {
  const { data } = await api.get<Paginated<Task>>('/tasks', { params });
  // Normalize dates to ISO strings (backend already returns Date serialized)
  return {
    ...data,
    data: data.data.map((t) => ({
      ...t,
      createdAt: new Date(t.createdAt as unknown as string).toISOString(),
      updatedAt: new Date(t.updatedAt as unknown as string).toISOString(),
      dueDate: t.dueDate ? new Date(t.dueDate as unknown as string).toISOString() : null,
      lastAssignedAt: (t as any).lastAssignedAt
        ? new Date((t as any).lastAssignedAt as string).toISOString()
        : undefined,
    })),
  };
}

export async function getTask(id: UUID): Promise<Task> {
  const { data } = await api.get<Task>(`/tasks/${id}`);
  return {
    ...data,
    createdAt: new Date(data.createdAt as unknown as string).toISOString(),
    updatedAt: new Date(data.updatedAt as unknown as string).toISOString(),
    dueDate: data.dueDate ? new Date(data.dueDate as unknown as string).toISOString() : null,
    lastAssignedAt: (data as any).lastAssignedAt
      ? new Date((data as any).lastAssignedAt as string).toISOString()
      : undefined,
  };
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const { data } = await api.post<Task>('/tasks', input);
  return {
    ...data,
    createdAt: new Date(data.createdAt as unknown as string).toISOString(),
    updatedAt: new Date(data.updatedAt as unknown as string).toISOString(),
    dueDate: data.dueDate ? new Date(data.dueDate as unknown as string).toISOString() : null,
  };
}

export async function updateTask(id: UUID, input: UpdateTaskInput): Promise<Task> {
  const { data } = await api.put<Task>(`/tasks/${id}`, input);
  return {
    ...data,
    createdAt: new Date(data.createdAt as unknown as string).toISOString(),
    updatedAt: new Date(data.updatedAt as unknown as string).toISOString(),
    dueDate: data.dueDate ? new Date(data.dueDate as unknown as string).toISOString() : null,
  };
}

export async function deleteTask(id: UUID): Promise<void> {
  await api.delete(`/tasks/${id}`);
}

export async function listComments(
  taskId: UUID,
  params: { page?: number; size?: number } = {},
): Promise<Paginated<Comment>> {
  const { data } = await api.get<Paginated<Comment>>(`/tasks/${taskId}/comments`, { params });
  return {
    ...data,
    data: data.data.map((c) => ({ ...c, createdAt: new Date(c.createdAt).toISOString() })),
  };
}

export async function createComment(taskId: UUID, input: CreateCommentInput): Promise<Comment> {
  const { data } = await api.post<Comment>(`/tasks/${taskId}/comments`, input);
  return { ...data, createdAt: new Date(data.createdAt).toISOString() };
}

export async function listHistory(
  taskId: UUID,
  params: { page?: number; size?: number } = {},
): Promise<Paginated<TaskHistory>> {
  const { data } = await api.get<Paginated<TaskHistory>>(`/tasks/${taskId}/history`, { params });
  return {
    ...data,
    data: data.data.map((h) => ({ ...h, createdAt: new Date(h.createdAt).toISOString() })),
  };
}
