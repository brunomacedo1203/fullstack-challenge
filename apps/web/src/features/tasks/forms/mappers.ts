import type { Task, UpdateTaskInput } from '../../tasks/types';
import type { EditTaskForm } from './editTaskForm';
import { parseCsv } from '../../../lib/csv';

export function taskToEditForm(task: Task): EditTaskForm {
  return {
    title: task.title,
    description: task.description ?? '',
    dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
    status: task.status,
    priority: task.priority,
    assigneeIds: task.assigneeIds.join(', '),
  };
}

export function buildUpdatePayload(values: EditTaskForm): UpdateTaskInput {
  return {
    title: values.title,
    description: values.description || undefined,
    dueDate: values.dueDate || undefined,
    status: values.status,
    priority: values.priority,
    assigneeIds: values.assigneeIds ? parseCsv(values.assigneeIds) : [],
  };
}
