import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task, TaskAssignee, TaskPriority, TaskStatus } from './entities';

export interface Paginated<T> {
  data: T[];
  page: number;
  size: number;
  total: number;
}

export type TaskResponse = {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: Date | null;
  priority: Task['priority'];
  status: Task['status'];
  createdAt: Date;
  updatedAt: Date;
  assigneeIds: string[];
};

@Injectable()
export class TasksService {
  constructor(@InjectRepository(Task) private readonly tasksRepo: Repository<Task>) {}

  async list(page = 1, size = 10): Promise<Paginated<TaskResponse>> {
    const take = Math.max(1, Math.min(100, size));
    const skip = Math.max(0, (Math.max(1, page) - 1) * take);

    const [tasks, total] = await this.tasksRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip,
      take,
      relations: ['assignees'],
    });

    const data: TaskResponse[] = tasks.map((task) => this.toTaskResponse(task));

    return { data, page: Math.max(1, page), size: take, total };
  }

  async getById(id: string): Promise<TaskResponse> {
    const task = await this.tasksRepo.findOne({ where: { id }, relations: ['assignees'] });
    if (!task) throw new NotFoundException('Task not found');
    return this.toTaskResponse(task);
  }

  async create(dto: CreateTaskDto): Promise<TaskResponse> {
    const assigneeIds = this.normalizeAssigneeIds(dto.assigneeIds);

    const taskId = await this.tasksRepo.manager.transaction(async (manager) => {
      const taskRepo = manager.getRepository(Task);
      const assigneeRepo = manager.getRepository(TaskAssignee);

      const entity = taskRepo.create({
        title: dto.title,
        description: dto.description ?? null,
        dueDate: this.parseDueDate(dto.dueDate),
        priority: dto.priority ?? TaskPriority.MEDIUM,
        status: dto.status ?? TaskStatus.TODO,
      });

      const saved = await taskRepo.save(entity);

      if (assigneeIds.length) {
        const rows = assigneeIds.map((userId) => assigneeRepo.create({ taskId: saved.id, userId }));
        await assigneeRepo.insert(rows);
      }

      return saved.id;
    });

    return this.getById(taskId);
  }

  async update(id: string, dto: UpdateTaskDto): Promise<TaskResponse> {
    const assigneeIds =
      dto.assigneeIds !== undefined ? this.normalizeAssigneeIds(dto.assigneeIds) : undefined;

    await this.tasksRepo.manager.transaction(async (manager) => {
      const taskRepo = manager.getRepository(Task);

      const existing = await taskRepo.findOne({ where: { id } });
      if (!existing) throw new NotFoundException('Task not found');

      if (dto.title !== undefined) existing.title = dto.title;
      if (dto.description !== undefined) existing.description = dto.description ?? null;
      if (dto.dueDate !== undefined) existing.dueDate = this.parseDueDate(dto.dueDate);
      if (dto.priority !== undefined) existing.priority = dto.priority;
      if (dto.status !== undefined) existing.status = dto.status;

      await taskRepo.save(existing);

      if (assigneeIds !== undefined) {
        await this.replaceAssignees(manager, id, assigneeIds);
      }
    });

    return this.getById(id);
  }

  async delete(id: string): Promise<{ id: string }> {
    const existing = await this.tasksRepo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Task not found');

    await this.tasksRepo.delete({ id });
    return { id };
  }

  private toTaskResponse(task: Task & { assignees?: TaskAssignee[] }): TaskResponse {
    return {
      id: task.id,
      title: task.title,
      description: task.description ?? null,
      dueDate: task.dueDate ?? null,
      priority: task.priority,
      status: task.status,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      assigneeIds: (task.assignees ?? []).map((assignee) => assignee.userId),
    };
  }

  private parseDueDate(value?: string): Date | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid due date');
    }

    return date;
  }

  private normalizeAssigneeIds(assigneeIds?: string[]): string[] {
    if (!assigneeIds || assigneeIds.length === 0) {
      return [];
    }

    const uniqueIds = Array.from(new Set(assigneeIds));

    if (uniqueIds.length !== assigneeIds.length) {
      throw new BadRequestException('Duplicate assignee IDs are not allowed');
    }

    return uniqueIds;
  }

  private async replaceAssignees(
    manager: EntityManager,
    taskId: string,
    assigneeIds: string[],
  ): Promise<void> {
    const assigneeRepo = manager.getRepository(TaskAssignee);

    await assigneeRepo.delete({ taskId });

    if (!assigneeIds.length) {
      return;
    }

    const rows = assigneeIds.map((userId) => assigneeRepo.create({ taskId, userId }));
    await assigneeRepo.insert(rows);
  }
}
