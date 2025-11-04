export type NotificationItem = {
  id: string;
  type: string; // e.g., 'task.created' | 'task.updated' | 'task.comment.created'
  taskId: string;
  commentId?: string | null;
  title: string;
  body?: string | null;
  createdAt: string; // ISO string
  readAt?: string | null;
};
