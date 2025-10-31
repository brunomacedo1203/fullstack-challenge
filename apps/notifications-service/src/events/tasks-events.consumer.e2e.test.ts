import { mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TaskCreatedEvent, TaskUpdatedEvent, TaskCommentCreatedEvent } from '@jungle/types';
import { TasksEventsConsumer } from './tasks-events.consumer';

const createConfigService = (): ConfigService =>
  ({ get: (_k: string, def?: unknown) => def }) as ConfigService;

const silenceLogs = () => {
  const restoreLog = mock.method(Logger, 'log', () => undefined);
  const restoreWarn = mock.method(Logger, 'warn', () => undefined);
  const restoreError = mock.method(Logger, 'error', () => undefined);
  return () => {
    restoreLog.mock.restore();
    restoreWarn.mock.restore();
    restoreError.mock.restore();
  };
};

const msg = (event: TaskCreatedEvent | TaskUpdatedEvent | TaskCommentCreatedEvent) => ({
  fields: { routingKey: event.type },
  content: Buffer.from(JSON.stringify(event)),
});

test('E2E path: A creates/updates/comments; B receives only his own', async (t) => {
  t.mock.reset();
  const restoreLogs = silenceLogs();
  t.after(() => {
    restoreLogs();
    mock.reset();
  });

  const notifications = {
    handleTaskCreated: mock.fn(async () => ['user-B']),
    handleTaskUpdated: mock.fn(async () => ['user-B']),
    handleTaskCommentCreated: mock.fn(async () => ['user-B']),
  } as Record<string, unknown>;

  const ws = { emitToUsers: mock.fn(() => undefined) } as Record<string, unknown>;

  // Minimal metrics stub
  const metrics = {
    incrementReceived: () => undefined,
    incrementProcessed: () => undefined,
    incrementFailed: () => undefined,
  } as Record<string, unknown>;

  const consumer = new TasksEventsConsumer(
    createConfigService(),
    notifications as any,
    ws as any,
    metrics as any,
  );

  const ack = mock.fn(() => undefined);
  const nack = mock.fn(() => undefined);
  const channel = { ack, nack } as unknown as Record<string, unknown>;

  const created: TaskCreatedEvent = {
    type: 'task.created',
    taskId: 'task-1',
    occurredAt: new Date().toISOString(),
    actorId: 'user-A',
    payload: {
      title: 't',
      description: null,
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: null,
      assigneeIds: ['user-B'],
    },
  };
  await (consumer as any).handleMessage(channel, msg(created));
  assert.equal(ack.mock.calls.length, 1);

  const updated: TaskUpdatedEvent = {
    type: 'task.updated',
    taskId: 'task-1',
    occurredAt: new Date().toISOString(),
    actorId: 'user-A',
    payload: {
      changedFields: { title: { from: 't', to: 't2' } },
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: null,
      assigneeIds: ['user-B'],
    },
  };
  await (consumer as any).handleMessage(channel, msg(updated));
  assert.equal(ack.mock.calls.length, 2);

  const commented: TaskCommentCreatedEvent = {
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
  await (consumer as any).handleMessage(channel, msg(commented));
  assert.equal(ack.mock.calls.length, 3);

  // Expect three WS emits targeting only user-B
  assert.equal((ws as any).emitToUsers.mock.calls.length, 3);
  for (const call of (ws as any).emitToUsers.mock.calls) {
    assert.deepEqual(call.arguments?.[2], ['user-B']);
  }
});
