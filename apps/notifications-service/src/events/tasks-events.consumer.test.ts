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
  const consumer = new TasksEventsConsumer(createConfigService());

  const dispatchEvent = mock.fn(async () => undefined);
  (consumer as any).dispatchEvent = dispatchEvent;

  const ack = mock.fn(() => undefined) as AckFn;
  const nack = mock.fn(() => undefined) as AckFn;

  await (consumer as any).handleMessage({ ack, nack } as Record<string, unknown>, createMessage());

  assert.strictEqual(ack.mock.calls.length, 1);
  assert.strictEqual(nack.mock.calls.length, 0);
  assert.strictEqual(dispatchEvent.mock.calls.length, 1);
  const firstCall = dispatchEvent.mock.calls[0];
  if (!firstCall) {
    throw new Error('dispatchEvent was not invoked');
  }
  const args = (firstCall.arguments ?? []) as unknown[];
  const eventArg = args[0];
  if (!eventArg || typeof eventArg !== 'object') {
    throw new Error('dispatchEvent received invalid payload');
  }
  assert.strictEqual((eventArg as { type: string }).type, 'task.created');
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
  const consumer = new TasksEventsConsumer(createConfigService());

  const dispatchEvent = mock.fn(async () => undefined);
  (consumer as any).dispatchEvent = dispatchEvent;

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
  assert.strictEqual(dispatchEvent.mock.calls.length, 1);
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
  const consumer = new TasksEventsConsumer(createConfigService());

  const ack = mock.fn(() => undefined) as AckFn;
  const nack = mock.fn(() => undefined) as AckFn;

  const dispatchEvent = mock.fn(async () => undefined);
  (consumer as any).dispatchEvent = dispatchEvent;

  const invalidMessage = {
    fields: { routingKey: 'task.created' },
    content: Buffer.from('{"type":"task.created"}'),
  } as unknown;

  await (consumer as any).handleMessage({ ack, nack } as Record<string, unknown>, invalidMessage);

  assert.strictEqual(ack.mock.calls.length, 0);
  assert.strictEqual(nack.mock.calls.length, 1);
  assert.strictEqual(nack.mock.calls[0].arguments?.[2], false);
  assert.strictEqual(dispatchEvent.mock.calls.length, 0);
});
