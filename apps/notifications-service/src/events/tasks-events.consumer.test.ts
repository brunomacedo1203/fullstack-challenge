import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TaskCreatedEvent } from '@jungle/types';

type AckFn = ReturnType<typeof mock.fn>;

const createConfigService = (): ConfigService =>
  ({
    get: (_key: string, defaultValue?: unknown) => defaultValue,
  }) as ConfigService;

const BASE_EVENT: TaskCreatedEvent = {
  type: 'task.created',
  taskId: 'task-123',
  occurredAt: '2024-01-01T00:00:00.000Z',
  actorId: 'user-456',
  payload: {
    title: 'Implement feature',
    description: null,
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: null,
    assigneeIds: ['user-789'],
  },
};

const createMessage = (overrides: Partial<TaskCreatedEvent> = {}) => {
  const payloadOverrides = overrides.payload ?? {};
  const event: TaskCreatedEvent = {
    ...BASE_EVENT,
    ...overrides,
    payload: {
      ...BASE_EVENT.payload,
      ...payloadOverrides,
    },
  };

  return {
    fields: { routingKey: event.type },
    content: Buffer.from(JSON.stringify(event)),
  } as unknown;
};

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

test('handleMessage ACKs the message when processing succeeds', async (t) => {
  t.mock.reset();
  const restoreLogs = silenceLogs();
  t.after(() => {
    restoreLogs();
    mock.reset();
  });

  t.mock.module('amqplib', {
    namedExports: {
      connect: async () => ({
        createChannel: async () => ({}),
        close: async () => undefined,
      }),
    },
  });

  const { TasksEventsConsumer } = await import('./tasks-events.consumer');
  const notifications = {
    handleTaskCreated: mock.fn(async () => undefined),
    handleTaskUpdated: mock.fn(async () => undefined),
    handleTaskCommentCreated: mock.fn(async () => undefined),
  } as Record<string, unknown>;
  const consumer = new TasksEventsConsumer(createConfigService(), notifications as any);

  const ack = mock.fn(() => undefined) as AckFn;
  const nack = mock.fn(() => undefined) as AckFn;

  await (consumer as any).handleMessage({ ack, nack } as Record<string, unknown>, createMessage());

  assert.strictEqual(ack.mock.calls.length, 1);
  assert.strictEqual(nack.mock.calls.length, 0);
  assert.strictEqual((notifications.handleTaskCreated as any).mock.calls.length, 1);
});

test('handleMessage NACKs the message when ACK throws', async (t) => {
  t.mock.reset();
  const restoreLogs = silenceLogs();
  t.after(() => {
    restoreLogs();
    mock.reset();
  });

  t.mock.module('amqplib', {
    namedExports: {
      connect: async () => ({
        createChannel: async () => ({}),
        close: async () => undefined,
      }),
    },
  });

  const { TasksEventsConsumer } = await import('./tasks-events.consumer');
  const notifications = {
    handleTaskCreated: mock.fn(async () => undefined),
    handleTaskUpdated: mock.fn(async () => undefined),
    handleTaskCommentCreated: mock.fn(async () => undefined),
  } as Record<string, unknown>;
  const consumer = new TasksEventsConsumer(createConfigService(), notifications as any);

  const ackError = new Error('ack failure');
  const ack = mock.fn(() => {
    throw ackError;
  }) as AckFn;
  const nack = mock.fn(() => undefined) as AckFn;

  await (consumer as any).handleMessage({ ack, nack } as Record<string, unknown>, createMessage());

  assert.strictEqual(ack.mock.calls.length, 1);
  assert.strictEqual(nack.mock.calls.length, 1);
  assert.strictEqual(nack.mock.calls[0].arguments?.[0], ack.mock.calls[0].arguments?.[0]);
  assert.strictEqual(nack.mock.calls[0].arguments?.[2], false);
  assert.strictEqual((notifications.handleTaskCreated as any).mock.calls.length, 1);
});

test('handleMessage NACKs invalid payloads without calling dispatch', async (t) => {
  t.mock.reset();
  const restoreLogs = silenceLogs();
  t.after(() => {
    restoreLogs();
    mock.reset();
  });

  t.mock.module('amqplib', {
    namedExports: {
      connect: async () => ({
        createChannel: async () => ({
          ack: mock.fn(() => undefined),
          nack: mock.fn(() => undefined),
        }),
        close: async () => undefined,
      }),
    },
  });

  const { TasksEventsConsumer } = await import('./tasks-events.consumer');
  const notifications = {
    handleTaskCreated: mock.fn(async () => undefined),
    handleTaskUpdated: mock.fn(async () => undefined),
    handleTaskCommentCreated: mock.fn(async () => undefined),
  } as Record<string, unknown>;
  const consumer = new TasksEventsConsumer(createConfigService(), notifications as any);

  const ack = mock.fn(() => undefined) as AckFn;
  const nack = mock.fn(() => undefined) as AckFn;

  const invalidMessage = {
    fields: { routingKey: 'task.created' },
    content: Buffer.from('{"type":"task.created"}'),
  } as unknown;

  await (consumer as any).handleMessage({ ack, nack } as Record<string, unknown>, invalidMessage);

  assert.strictEqual(ack.mock.calls.length, 0);
  assert.strictEqual(nack.mock.calls.length, 1);
  assert.strictEqual(nack.mock.calls[0].arguments?.[2], false);
  assert.strictEqual((notifications.handleTaskCreated as any).mock.calls.length, 0);
});
