export type UUID = string;

export type Paginated<T> = {
  data: T[];
  page: number;
  size: number;
  total: number;
};

export type Task = {
  id: UUID;
  title: string;
  description?: string | null;
  dueDate?: string | null; // ISO when serialized
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  createdAt: string; // ISO
  updatedAt: string; // ISO
  assigneeIds: UUID[];
  // Optional metadata provided by backend to indicate the last assignment actor/time
  lastAssignedById?: UUID;
  lastAssignedByUsername?: string;
  lastAssignedAt?: string; // ISO
};

export type CreateTaskInput = {
  title: string;
  description?: string;
  dueDate?: string; // YYYY-MM-DD
  priority?: Task['priority'];
  status?: Task['status'];
  assigneeIds?: UUID[];
};

export type UpdateTaskInput = Partial<CreateTaskInput>;

export type Comment = {
  id: UUID;
  taskId: UUID;
  authorId?: UUID | null;
  content: string;
  createdAt: string; // ISO
};

export type CreateCommentInput = {
  content: string;
};

export type TaskHistoryEventType = 'TASK_CREATED' | 'TASK_UPDATED' | 'COMMENT_CREATED';

export type TaskHistory = {
  id: UUID;
  taskId: UUID;
  actorId?: UUID | null;
  type: TaskHistoryEventType;
  payload?: Record<string, unknown> | null;
  createdAt: string; // ISO
};
