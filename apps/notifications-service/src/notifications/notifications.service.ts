import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { TaskCommentCreatedEvent, TaskCreatedEvent, TaskUpdatedEvent } from '@jungle/types';
import { TaskParticipants } from './task-participants.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepo: Repository<Notification>,
    @InjectRepository(TaskParticipants)
    private readonly participantsRepo: Repository<TaskParticipants>,
  ) {}

  async handleTaskCreated(event: TaskCreatedEvent): Promise<string[]> {
    const assignees = this.normalizeIds(event.payload.assigneeIds);
    const creatorId = event.actorId ?? null;

    await this.participantsRepo.upsert(
      {
        taskId: event.taskId,
        creatorId,
        assigneeIds: assignees,
      },
      ['taskId'],
    );

    const recipients = assignees.filter((id) => !creatorId || id !== creatorId);
    if (recipients.length === 0) {
      return [];
    }

    const notifications = recipients.map((recipientId) =>
      this.notificationsRepo.create({
        recipientId,
        type: event.type,
        taskId: event.taskId,
        title: `Nova tarefa: ${event.payload.title}`,
        body: 'Uma nova tarefa foi criada.',
      }),
    );

    await this.notificationsRepo.save(notifications);
    return recipients;
  }

  async handleTaskUpdated(event: TaskUpdatedEvent): Promise<string[]> {
    const nextAssignees = this.normalizeIds(event.payload.assigneeIds);
    const existing = await this.participantsRepo.findOne({ where: { taskId: event.taskId } });
    const creatorId = existing?.creatorId ?? null;

    // Persist latest participants snapshot
    await this.participantsRepo.upsert(
      {
        taskId: event.taskId,
        creatorId,
        assigneeIds: nextAssignees,
      },
      ['taskId'],
    );

    // Determine which changes should trigger notifications
    const changedFields = event.payload.changedFields ?? {};
    const hasStatusChange = Object.prototype.hasOwnProperty.call(changedFields, 'status');

    let addedAssignees: string[] = [];
    if (Object.prototype.hasOwnProperty.call(changedFields, 'assigneeIds')) {
      const from = this.normalizeIds(
        (changedFields as any).assigneeIds?.from ?? existing?.assigneeIds ?? [],
      );
      const to = this.normalizeIds((changedFields as any).assigneeIds?.to ?? nextAssignees);
      const fromSet = new Set(from);
      addedAssignees = to.filter((id) => !fromSet.has(id));
    }

    // Build recipients set according to business rules
    const recipients = new Set<string>();
    if (hasStatusChange) {
      nextAssignees.forEach((id) => recipients.add(id));
      if (creatorId) recipients.add(creatorId);
    }
    // Notify only newly added assignees on assignment changes
    for (const id of addedAssignees) recipients.add(id);

    // Exclude actor to avoid self-notifications
    if (event.actorId) recipients.delete(event.actorId);

    if (recipients.size === 0) {
      return [];
    }

    const addedSet = new Set(addedAssignees);
    const notifications = Array.from(recipients).map((recipientId) => {
      const isAssignment = addedSet.has(recipientId);
      const title = isAssignment ? 'Tarefa atribuída' : 'Tarefa atualizada';
      const body = isAssignment
        ? 'Você foi atribuído(a) a esta tarefa.'
        : `Status alterado para ${String(event.payload.status)}.`;
      return this.notificationsRepo.create({
        recipientId,
        type: event.type,
        taskId: event.taskId,
        title,
        body,
      });
    });

    await this.notificationsRepo.save(notifications);
    return Array.from(recipients);
  }

  async handleTaskCommentCreated(event: TaskCommentCreatedEvent): Promise<string[]> {
    const participants = await this.participantsRepo.findOne({ where: { taskId: event.taskId } });
    if (!participants) {
      this.logger.warn(
        `Nenhum participante conhecido para tarefa ${event.taskId}; ignorando comentário`,
      );
      return [];
    }

    const recipients = new Set(participants.assigneeIds ?? []);
    if (participants.creatorId) {
      recipients.add(participants.creatorId);
    }
    if (event.payload.authorId) {
      recipients.delete(event.payload.authorId);
    }
    if (event.actorId) {
      recipients.delete(event.actorId);
    }

    if (recipients.size === 0) {
      return [];
    }

    const preview = event.payload.content.slice(0, 100);
    const notifications = Array.from(recipients).map((recipientId) =>
      this.notificationsRepo.create({
        recipientId,
        type: event.type,
        taskId: event.taskId,
        commentId: event.payload.commentId,
        title: 'Novo comentário',
        body: preview,
      }),
    );

    await this.notificationsRepo.save(notifications);
    return Array.from(recipients);
  }

  async listUnread(recipientId: string, limit = 10): Promise<Notification[]> {
    return this.notificationsRepo.find({
      where: { recipientId, readAt: IsNull() },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async markAsRead(id: string, recipientId: string): Promise<Notification> {
    const existing = await this.notificationsRepo.findOne({ where: { id, recipientId } });
    if (!existing) {
      throw new NotFoundException('Notification not found');
    }

    if (existing.readAt) {
      return existing;
    }

    existing.readAt = new Date();
    return this.notificationsRepo.save(existing);
  }

  private normalizeIds(ids: readonly string[] | undefined): string[] {
    if (!ids || ids.length === 0) {
      return [];
    }

    return Array.from(new Set(ids.filter((value): value is string => typeof value === 'string')))
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
  }
}
