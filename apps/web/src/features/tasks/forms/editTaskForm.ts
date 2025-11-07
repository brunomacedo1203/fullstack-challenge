import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
export const editTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  dueDate: z
    .string()
    .regex(dateRegex, 'Data deve estar no formato YYYY-MM-DD')
    .optional()
    .or(z.literal('')),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  assigneeIds: z.string().optional(),
});

export type EditTaskForm = z.infer<typeof editTaskSchema>;
