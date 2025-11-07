import { mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { ObjectLiteral, Repository } from 'typeorm';
import { NotificationsService } from './notifications.service';
import { Notification } from './notification.entity';
import { TaskParticipants } from './task-participants.entity';
import { TaskCreatedEvent, TaskUpdatedEvent, TaskCommentCreatedEvent } from '@jungle/types';

const repo = <T extends ObjectLiteral>(
  overrides: Partial<Record<keyof Repository<T>, unknown>> = {},
): Repository<T> =>
  ({
    create: (entity: T) => entity,
    save: async (entities: T | T[]) => entities,
    upsert: async () => undefined,
    findOne: async () => null,
    find: async () => [],
    ...overrides,
  }) as unknown as Repository<T>;

test('handleTaskCreated stores participants and notifies assignees (excludes actor)', async () => {
  const notificationsRepo = repo<Notification>();
  const upsert = mock.fn(async () => undefined);
  const participantsRepo = repo<TaskParticipants>({ upsert });

  const service = new NotificationsService(notificationsRepo, participantsRepo);

  const event: TaskCreatedEvent = {
    type: 'task.created',
    taskId: 'task-1',
    occurredAt: new Date().toISOString(),
    actorId: 'user-A',
    payload: {
      title: 'Hello',
      description: null,
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: null,
      assigneeIds: ['user-A', 'user-B'],
    },
  };

  const recipients = await service.handleTaskCreated(event);
  assert.deepEqual(recipients, ['user-B']);
  assert.equal(upsert.mock.calls.length, 1);
});

test('handleTaskUpdated notifies participants on status change (excludes actor)', async () => {
  const notificationsRepo = repo<Notification>();
  const findOne = mock.fn(async () => ({
    taskId: 'task-1',
    creatorId: 'user-A',
    assigneeIds: ['user-B'],
  }));
  const participantsRepo = repo<TaskParticipants>({ findOne });

  const service = new NotificationsService(notificationsRepo, participantsRepo);

  const event: TaskUpdatedEvent = {
    type: 'task.updated',
    taskId: 'task-1',
    occurredAt: new Date().toISOString(),
    actorId: 'user-A',
    payload: {
      changedFields: { status: { from: 'TODO', to: 'IN_PROGRESS' } },
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      dueDate: null,
      assigneeIds: ['user-B'],
    },
  };

  const recipients = await service.handleTaskUpdated(event);
  assert.deepEqual(new Set(recipients), new Set(['user-B']));
});

test('handleTaskUpdated does not notify when only non-relevant fields change', async () => {
  const notificationsRepo = repo<Notification>();
  const findOne = mock.fn(async () => ({
    taskId: 'task-1',
    creatorId: 'user-A',
    assigneeIds: ['user-B'],
  }));
  const participantsRepo = repo<TaskParticipants>({ findOne });

  const service = new NotificationsService(notificationsRepo, participantsRepo);

  const event: TaskUpdatedEvent = {
    type: 'task.updated',
    taskId: 'task-1',
    occurredAt: new Date().toISOString(),
    actorId: 'user-A',
    payload: {
      changedFields: { title: { from: 'a', to: 'b' }, description: { from: 'x', to: 'y' } },
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: null,
      assigneeIds: ['user-B'],
    },
  };

  const recipients = await service.handleTaskUpdated(event);
  assert.deepEqual(recipients, []);
});

test('handleTaskUpdated notifies only newly added assignees', async () => {
  const notificationsRepo = repo<Notification>();
  const findOne = mock.fn(async () => ({
    taskId: 'task-1',
    creatorId: 'user-A',
    assigneeIds: ['user-B'],
  }));
  const participantsRepo = repo<TaskParticipants>({ findOne });

  const service = new NotificationsService(notificationsRepo, participantsRepo);

  const event: TaskUpdatedEvent = {
    type: 'task.updated',
    taskId: 'task-1',
    occurredAt: new Date().toISOString(),
    actorId: 'user-A',
    payload: {
      changedFields: { assigneeIds: { from: ['user-B'], to: ['user-B', 'user-C'] } },
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: null,
      assigneeIds: ['user-B', 'user-C'],
    },
  };

  const recipients = await service.handleTaskUpdated(event);
  assert.deepEqual(new Set(recipients), new Set(['user-C']));
});

test('handleTaskCommentCreated notifies participants except author and actor', async () => {
  const notificationsRepo = repo<Notification>();
  const findOne = mock.fn(async () => ({
    taskId: 'task-1',
    creatorId: 'user-A',
    assigneeIds: ['user-B', 'user-C'],
  }));
  const participantsRepo = repo<TaskParticipants>({ findOne });

  const service = new NotificationsService(notificationsRepo, participantsRepo);

  const event: TaskCommentCreatedEvent = {
    type: 'task.comment.created',
    taskId: 'task-1',
    occurredAt: new Date().toISOString(),
    actorId: 'user-A',
    payload: {
      commentId: 'c-1',
      authorId: 'user-A',
      content: 'nice',
    },
  };

  const recipients = await service.handleTaskCommentCreated(event);
  assert.deepEqual(new Set(recipients), new Set(['user-B', 'user-C']));
});
