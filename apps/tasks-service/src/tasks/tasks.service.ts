import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { TaskCommentCreatedEvent, TaskCreatedEvent, TaskUpdatedEvent } from '@jungle/types';
import { TasksEventsPublisher } from '../events/tasks-events.publisher';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ListCommentsQueryDto } from './dto/list-comments.query.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import {
  Comment,
  Task,
  TaskAssignee,
  TaskHistory,
  TaskHistoryEventType,
  TaskPriority,
  TaskStatus,
} from './entities';

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

export type CommentResponse = {
  id: string;
  taskId: string;
  authorId?: string | null;
  content: string;
  createdAt: Date;
};

type TaskSnapshot = {
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  assigneeIds: string[];
};

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private readonly tasksRepo: Repository<Task>,
    @InjectRepository(Comment) private readonly commentsRepo: Repository<Comment>,
    private readonly eventsPublisher: TasksEventsPublisher,
  ) {}

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

  async create(dto: CreateTaskDto, actorId?: string): Promise<TaskResponse> {
    const assigneeIds = this.normalizeAssigneeIds(dto.assigneeIds);

    const taskId = await this.tasksRepo.manager.transaction(async (manager) => {
      const taskRepo = manager.getRepository(Task);
      const assigneeRepo = manager.getRepository(TaskAssignee);
      const historyRepo = manager.getRepository(TaskHistory);

      const dueDate = this.parseDueDate(dto.dueDate);
      const saved = await taskRepo.save({
        title: dto.title,
        description: dto.description ?? null,
        dueDate,
        priority: dto.priority ?? TaskPriority.MEDIUM,
        status: dto.status ?? TaskStatus.TODO,
      });

      if (assigneeIds.length) {
        const rows = assigneeIds.map((userId) => ({ taskId: saved.id, userId }));
        await assigneeRepo.insert(rows);
      }

      const historyPayload = this.buildTaskSnapshot(saved, assigneeIds);
      await historyRepo.save(
        historyRepo.create({
          taskId: saved.id,
          actorId: actorId ?? null,
          type: TaskHistoryEventType.TASK_CREATED,
          payload: historyPayload,
        }),
      );

      return saved.id;
    });

    const task = await this.getById(taskId);
    await this.eventsPublisher.publishTaskCreated(this.toTaskCreatedEvent(task, actorId));
    return task;
  }

  async update(id: string, dto: UpdateTaskDto, actorId?: string): Promise<TaskResponse> {
    const assigneeIds =
      dto.assigneeIds !== undefined ? this.normalizeAssigneeIds(dto.assigneeIds) : undefined;

    const { changedFields, afterSnapshot } = await this.tasksRepo.manager.transaction(
      async (manager) => {
        const taskRepo = manager.getRepository(Task);
        const historyRepo = manager.getRepository(TaskHistory);

        const existing = await taskRepo.findOne({ where: { id }, relations: ['assignees'] });
        if (!existing) throw new NotFoundException('Task not found');

        const previousAssigneeIds = (existing.assignees ?? []).map((assignee) => assignee.userId);
        const beforeSnapshot = this.buildTaskSnapshot(existing, previousAssigneeIds);

        // Prevent TypeORM from attempting to update relations via save
        delete (existing as { assignees?: TaskAssignee[] }).assignees;

        if (dto.title !== undefined) existing.title = dto.title;
        if (dto.description !== undefined) existing.description = dto.description ?? null;
        if (dto.dueDate !== undefined) existing.dueDate = this.parseDueDate(dto.dueDate);
        if (dto.priority !== undefined) existing.priority = dto.priority;
        if (dto.status !== undefined) existing.status = dto.status;

        await taskRepo.save(existing);

        const nextAssigneeIds = assigneeIds ?? previousAssigneeIds;
        const afterSnapshot = this.buildTaskSnapshot(existing, nextAssigneeIds);
        const changedFields = this.diffSnapshots(beforeSnapshot, afterSnapshot);

        if (assigneeIds !== undefined) {
          await this.replaceAssignees(manager, id, assigneeIds);
        }

        if (Object.keys(changedFields).length > 0) {
          await historyRepo.save(
            historyRepo.create({
              taskId: id,
              actorId: actorId ?? null,
              type: TaskHistoryEventType.TASK_UPDATED,
              payload: changedFields,
            }),
          );
        }
        return { changedFields, afterSnapshot };
      },
    );

    const task = await this.getById(id);

    if (changedFields && Object.keys(changedFields).length > 0) {
      await this.eventsPublisher.publishTaskUpdated(
        this.toTaskUpdatedEvent(id, changedFields, afterSnapshot, actorId),
      );
    }

    return task;
  }

  async delete(id: string): Promise<{ id: string }> {
    const existing = await this.tasksRepo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Task not found');

    await this.tasksRepo.delete({ id });
    return { id };
  }

  async listComments(
    taskId: string,
    query: ListCommentsQueryDto,
  ): Promise<Paginated<CommentResponse>> {
    await this.ensureTaskExists(taskId);

    const page = query.page && query.page > 0 ? query.page : 1;
    const size = query.size && query.size > 0 ? Math.min(query.size, 100) : 10;
    const skip = (page - 1) * size;

    const [comments, total] = await this.commentsRepo.findAndCount({
      where: { taskId },
      order: { createdAt: 'DESC' },
      skip,
      take: size,
    });

    const data = comments.map((comment) => this.toCommentResponse(comment));

    return { data, page, size, total };
  }

  async createComment(
    taskId: string,
    dto: CreateCommentDto,
    actorId?: string,
  ): Promise<CommentResponse> {
    const content = dto.content.trim();
    if (!content) {
      throw new BadRequestException('Comment content must not be empty');
    }

    const resolvedAuthorId = actorId ?? dto.authorId ?? null;

    const comment = await this.tasksRepo.manager.transaction(async (manager) => {
      const taskRepo = manager.getRepository(Task);
      const commentRepo = manager.getRepository(Comment);
      const historyRepo = manager.getRepository(TaskHistory);

      const taskExists = await taskRepo.findOne({ where: { id: taskId } });
      if (!taskExists) {
        throw new NotFoundException('Task not found');
      }

      const entity = commentRepo.create({
        taskId,
        authorId: resolvedAuthorId,
        content,
      });
      const saved = await commentRepo.save(entity);

      await historyRepo.save(
        historyRepo.create({
          taskId,
          actorId: resolvedAuthorId,
          type: TaskHistoryEventType.COMMENT_CREATED,
          payload: {
            commentId: saved.id,
            content: saved.content,
            authorId: resolvedAuthorId,
          },
        }),
      );

      return saved;
    });

    await this.eventsPublisher.publishTaskCommentCreated(
      this.toTaskCommentCreatedEvent(comment, taskId, resolvedAuthorId ?? undefined),
    );

    return this.toCommentResponse(comment);
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

  private toCommentResponse(comment: Comment): CommentResponse {
    return {
      id: comment.id,
      taskId: comment.taskId,
      authorId: comment.authorId ?? null,
      content: comment.content,
      createdAt: comment.createdAt,
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

    const rows = assigneeIds.map((userId) => ({ taskId, userId }));
    await assigneeRepo.insert(rows);
  }

  private async ensureTaskExists(taskId: string): Promise<void> {
    const exists = await this.tasksRepo.exist({ where: { id: taskId } });
    if (!exists) {
      throw new NotFoundException('Task not found');
    }
  }

  private buildTaskSnapshot(
    task: {
      title: string;
      description?: string | null;
      status: TaskStatus;
      priority: TaskPriority;
      dueDate?: Date | null;
    },
    assigneeIds: string[],
  ): TaskSnapshot {
    return {
      title: task.title,
      description: task.description ?? null,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      assigneeIds: [...assigneeIds].sort(),
    };
  }

  private diffSnapshots(
    previous: TaskSnapshot,
    next: TaskSnapshot,
  ): Record<string, { from: unknown; to: unknown }> {
    const changes: Record<string, { from: unknown; to: unknown }> = {};

    const compare = <K extends keyof TaskSnapshot>(key: K) => {
      const prevValue = previous[key];
      const nextValue = next[key];
      if (!this.areEqual(prevValue, nextValue)) {
        changes[key] = {
          from: prevValue,
          to: nextValue,
        };
      }
    };

    compare('title');
    compare('description');
    compare('status');
    compare('priority');
    compare('dueDate');
    compare('assigneeIds');

    return changes;
  }

  private areEqual(a: unknown, b: unknown): boolean {
    if (Array.isArray(a) && Array.isArray(b)) {
      return a.length === b.length && a.every((value, index) => value === b[index]);
    }
    return a === b;
  }

  private toTaskCreatedEvent(task: TaskResponse, actorId?: string): TaskCreatedEvent {
    return {
      type: 'task.created',
      taskId: task.id,
      occurredAt: new Date().toISOString(),
      actorId,
      payload: {
        title: task.title,
        description: task.description ?? null,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        assigneeIds: task.assigneeIds,
      },
    };
  }

  private toTaskUpdatedEvent(
    taskId: string,
    changedFields: Record<string, { from: unknown; to: unknown }>,
    snapshot: TaskSnapshot,
    actorId?: string,
  ): TaskUpdatedEvent {
    return {
      type: 'task.updated',
      taskId,
      occurredAt: new Date().toISOString(),
      actorId,
      payload: {
        changedFields,
        status: snapshot.status,
        priority: snapshot.priority,
        dueDate: snapshot.dueDate,
        assigneeIds: snapshot.assigneeIds,
      },
    };
  }

  private toTaskCommentCreatedEvent(
    comment: Comment,
    taskId: string,
    actorId?: string,
  ): TaskCommentCreatedEvent {
    return {
      type: 'task.comment.created',
      taskId,
      occurredAt: comment.createdAt.toISOString(),
      actorId,
      payload: {
        commentId: comment.id,
        authorId: comment.authorId ?? undefined,
        content: comment.content,
      },
    };
  }
}
