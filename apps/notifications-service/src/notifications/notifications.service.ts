import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async handleTaskCreated(event: TaskCreatedEvent): Promise<void> {
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
      return;
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
  }

  async handleTaskUpdated(event: TaskUpdatedEvent): Promise<void> {
    const assignees = this.normalizeIds(event.payload.assigneeIds);
    const existing = await this.participantsRepo.findOne({ where: { taskId: event.taskId } });
    const creatorId = existing?.creatorId ?? null;

    await this.participantsRepo.upsert(
      {
        taskId: event.taskId,
        creatorId,
        assigneeIds: assignees,
      },
      ['taskId'],
    );

    const recipients = new Set(assignees);
    if (creatorId) {
      recipients.add(creatorId);
    }
    if (event.actorId) {
      recipients.delete(event.actorId);
    }

    if (recipients.size === 0) {
      return;
    }

    const changed = Object.keys(event.payload.changedFields).join(', ') || 'campos';
    const notifications = Array.from(recipients).map((recipientId) =>
      this.notificationsRepo.create({
        recipientId,
        type: event.type,
        taskId: event.taskId,
        title: 'Tarefa atualizada',
        body: `Alterações em ${changed}.`,
      }),
    );

    await this.notificationsRepo.save(notifications);
  }

  async handleTaskCommentCreated(event: TaskCommentCreatedEvent): Promise<void> {
    const participants = await this.participantsRepo.findOne({ where: { taskId: event.taskId } });
    if (!participants) {
      this.logger.warn(
        `Nenhum participante conhecido para tarefa ${event.taskId}; ignorando comentário`,
      );
      return;
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
      return;
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
