// Shared types for the Jungle monorepo.

export type UUID = string;

export interface TaskEventBase {
  taskId: UUID;
  occurredAt: string; // ISO timestamp
  actorId?: UUID;
}

export interface TaskCreatedEvent extends TaskEventBase {
  type: 'task.created';
  payload: {
    title: string;
    description?: string | null;
    status: string;
    priority: string;
    dueDate?: string | null;
    assigneeIds: UUID[];
  };
}

export interface TaskUpdatedEvent extends TaskEventBase {
  type: 'task.updated';
  payload: {
    changedFields: Record<string, { from: unknown; to: unknown }>;
    status: string;
    priority: string;
    dueDate?: string | null;
    assigneeIds: UUID[];
  };
}

export interface TaskCommentCreatedEvent extends TaskEventBase {
  type: 'task.comment.created';
  payload: {
    commentId: UUID;
    authorId?: UUID;
    content: string;
  };
}

export type TaskEvent = TaskCreatedEvent | TaskUpdatedEvent | TaskCommentCreatedEvent;
