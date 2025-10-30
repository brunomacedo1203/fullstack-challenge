import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type AckFn = ReturnType<typeof mock.fn>;

const createConfigService = (): ConfigService =>
  ({
    get: (_key: string, defaultValue?: unknown) => defaultValue,
  }) as ConfigService;

const createMessage = (payload: unknown = { id: 'any' }) =>
  ({
    fields: { routingKey: 'task.created' },
    content: Buffer.from(JSON.stringify(payload)),
  }) as unknown;

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
    connect: async () => ({
      createChannel: async () => ({}),
      close: async () => undefined,
    }),
  });

  const { TasksEventsConsumer } = await import('./tasks-events.consumer');
  const consumer = new TasksEventsConsumer(createConfigService());

  const ack = mock.fn(() => undefined) as AckFn;
  const nack = mock.fn(() => undefined) as AckFn;

  await (consumer as any).handleMessage({ ack, nack } as Record<string, unknown>, createMessage());

  assert.strictEqual(ack.mock.calls.length, 1);
  assert.strictEqual(nack.mock.calls.length, 0);
});

test('handleMessage NACKs the message when ACK throws', async (t) => {
  t.mock.reset();
  const restoreLogs = silenceLogs();
  t.after(() => {
    restoreLogs();
    mock.reset();
  });

  t.mock.module('amqplib', {
    connect: async () => ({
      createChannel: async () => ({}),
      close: async () => undefined,
    }),
  });

  const { TasksEventsConsumer } = await import('./tasks-events.consumer');
  const consumer = new TasksEventsConsumer(createConfigService());

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
});

test('setupConsumer wraps the handler with error handling and NACKs failures', async (t) => {
  t.mock.reset();
  const restoreLogs = silenceLogs();
  t.after(() => {
    restoreLogs();
    mock.reset();
  });

  let consumeHandler: ((message: unknown) => Promise<void>) | undefined;

  const ack = mock.fn(() => undefined) as AckFn;
  const nack = mock.fn(() => undefined) as AckFn;

  t.mock.module('amqplib', {
    connect: async () => ({
      createChannel: async () => ({
        assertExchange: async () => undefined,
        assertQueue: async () => undefined,
        bindQueue: async () => undefined,
        prefetch: async () => undefined,
        consume: async (_queue: string, handler: typeof consumeHandler) => {
          consumeHandler = handler;
        },
        ack,
        nack,
        close: async () => undefined,
      }),
      close: async () => undefined,
    }),
  });

  const { TasksEventsConsumer } = await import('./tasks-events.consumer');
  const consumer = new TasksEventsConsumer(createConfigService());

  const processingError = new Error('boom');
  const handleMessage = mock.fn(async () => {
    throw processingError;
  });
  (consumer as any).handleMessage = handleMessage;

  await (consumer as any).setupConsumer();

  assert.ok(consumeHandler, 'Consumer handler should be registered');

  await consumeHandler?.(createMessage());

  assert.strictEqual(handleMessage.mock.calls.length, 1);
  assert.strictEqual(ack.mock.calls.length, 0);
  assert.strictEqual(nack.mock.calls.length, 1);
  assert.strictEqual(nack.mock.calls[0].arguments?.[2], false);
});
