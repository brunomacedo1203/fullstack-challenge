import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Channel, ChannelModel, ConsumeMessage, Options, connect } from 'amqplib';
import {
  TaskCommentCreatedEvent,
  TaskCreatedEvent,
  TaskEvent,
  TaskUpdatedEvent,
} from '@jungle/types';
import { InvalidTaskEventError, parseTaskEvent } from './task-event.parser';
import { NotificationsService } from '../notifications/notifications.service';
import { MetricsService } from '../metrics/metrics.service';
import { WsGateway } from '../realtime/ws.gateway';

const LOGGER_CONTEXT = 'TasksEventsConsumer';
const MAX_LOG_PAYLOAD_LENGTH = 200;

@Injectable()
export class TasksEventsConsumer implements OnModuleInit, OnModuleDestroy {
  private connection?: ChannelModel;
  private channel?: Channel;
  private readonly exchange: string;
  private readonly queue: string;
  private readonly routingPattern: string;
  private readonly deadLetterExchange?: string;
  private readonly handlers: Record<TaskEvent['type'], (event: TaskEvent) => Promise<void>>;
  private isShuttingDown = false;
  private retryBaseMs: number;
  private retryMaxMs: number;
  private connecting?: Promise<void>;

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
    private readonly notifications: NotificationsService,
    private readonly ws: WsGateway,
    private readonly metrics: MetricsService,
  ) {
    this.exchange = this.configService.get<string>('TASKS_EVENTS_EXCHANGE', 'tasks.events');
    this.queue = this.configService.get<string>('NOTIFICATIONS_QUEUE', 'notifications.q');
    this.routingPattern = this.configService.get<string>('TASKS_EVENTS_ROUTING', 'task.#');
    this.deadLetterExchange = this.configService.get<string>('NOTIFICATIONS_DLX');
    this.retryBaseMs = Number(this.configService.get<string>('RABBITMQ_RETRY_BASE_MS', '500'));
    this.retryMaxMs = Number(this.configService.get<string>('RABBITMQ_RETRY_MAX_MS', '10000'));
    this.handlers = {
      'task.created': async (event) => this.handleTaskCreated(event as TaskCreatedEvent),
      'task.updated': async (event) => this.handleTaskUpdated(event as TaskUpdatedEvent),
      'task.comment.created': async (event) =>
        this.handleTaskCommentCreated(event as TaskCommentCreatedEvent),
    };
  }

  async onModuleInit(): Promise<void> {
    await this.ensureConnected();
  }

  async onModuleDestroy(): Promise<void> {
    this.isShuttingDown = true;
    await this.channel
      ?.close()
      .catch((error: unknown) =>
        Logger.warn(
          `Failed to close RabbitMQ channel: ${(error as Error).message}`,
          LOGGER_CONTEXT,
        ),
      );

    await this.connection
      ?.close()
      .catch((error: unknown) =>
        Logger.warn(
          `Failed to close RabbitMQ connection: ${(error as Error).message}`,
          LOGGER_CONTEXT,
        ),
      );
  }

  private async setupConsumerOnce(): Promise<void> {
    const url = this.configService.get<string>('RABBITMQ_URL', 'amqp://localhost:5672');

    this.connection = await connect(url);
    this.channel = await this.connection.createChannel();

    const channel = this.channel;

    await channel.assertExchange(this.exchange, 'topic', { durable: true });

    const queueOptions: Options.AssertQueue = {
      durable: true,
      deadLetterExchange: this.deadLetterExchange,
    };

    await channel.assertQueue(this.queue, queueOptions);
    const patterns = this.routingPattern
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    for (const pattern of patterns) {
      await channel.bindQueue(this.queue, this.exchange, pattern);
    }
    await channel.prefetch(10);

    await channel.consume(
      this.queue,
      async (message) => {
        if (!message) {
          Logger.warn('Received empty message from RabbitMQ', LOGGER_CONTEXT);
          return;
        }

        await this.handleMessage(channel, message);
      },
      {
        noAck: false,
      },
    );

    const safeOn = (emitter: any, event: string, handler: (...args: any[]) => void) => {
      if (emitter && typeof emitter.on === 'function') {
        try {
          emitter.on(event, handler);
        } catch {
          /* noop */
        }
      }
    };
    safeOn(this.connection as any, 'close', () => this.scheduleReconnect('connection_close'));
    safeOn(this.connection as any, 'error', () => this.scheduleReconnect('connection_error'));
    safeOn(this.channel as any, 'close', () => this.scheduleReconnect('channel_close'));
    safeOn(this.channel as any, 'error', () => this.scheduleReconnect('channel_error'));

    Logger.log(
      `RabbitMQ consumer ready (queue=${this.queue}, pattern=${this.routingPattern})`,
      LOGGER_CONTEXT,
    );
  }

  private async ensureConnected(): Promise<void> {
    if (this.channel && this.connection) return;
    if (!this.connecting) {
      this.connecting = this.connectWithRetry();
    }
    try {
      await this.connecting;
    } finally {
      this.connecting = undefined;
    }
  }

  private async connectWithRetry(): Promise<void> {
    let delay = this.retryBaseMs;
    while (!this.isShuttingDown) {
      try {
        await this.setupConsumerOnce();
        return;
      } catch (error) {
        Logger.warn(
          `RabbitMQ consumer connection failed: ${(error as Error).message}. Retrying in ${delay}ms`,
          LOGGER_CONTEXT,
        );
        await this.sleep(delay);
        delay = Math.min(this.retryMaxMs, Math.floor(delay * 1.5));
      }
    }
  }

  private scheduleReconnect(origin: string): void {
    if (this.isShuttingDown) return;
    this.channel = undefined;
    this.connection = undefined;
    Logger.warn(`Scheduling consumer reconnect (origin=${origin})`, LOGGER_CONTEXT);
    // Fire and forget — ensureConnected handles the loop
    this.ensureConnected().catch((err) =>
      Logger.error(`Reconnect failed: ${(err as Error).message}`, LOGGER_CONTEXT),
    );
  }

  private async handleMessage(channel: Channel, message: ConsumeMessage): Promise<void> {
    const { routingKey } = message.fields;
    const payload = message.content.toString('utf-8');

    this.metrics.incrementReceived(routingKey);

    const preview =
      payload.length > MAX_LOG_PAYLOAD_LENGTH
        ? `${payload.slice(0, MAX_LOG_PAYLOAD_LENGTH)}…`
        : payload;

    Logger.log(
      JSON.stringify({
        msg: 'event_received',
        routingKey,
        preview,
        timestamp: new Date().toISOString(),
      }),
      LOGGER_CONTEXT,
    );

    try {
      const event = parseTaskEvent(routingKey, payload);
      await this.dispatchEvent(event);
      this.metrics.incrementProcessed(event.type);
      try {
        channel.ack(message);
      } catch (ackError) {
        Logger.error(
          `ACK failed for ${routingKey}: ${(ackError as Error).message}`,
          undefined,
          LOGGER_CONTEXT,
        );
        try {
          channel.nack(message, false, false);
        } catch {}
      }
    } catch (error) {
      const reason =
        error instanceof InvalidTaskEventError || error instanceof Error
          ? error.message
          : 'Unknown error';

      Logger.error(
        JSON.stringify({
          msg: 'event_failed',
          routingKey,
          reason,
          timestamp: new Date().toISOString(),
        }),
        undefined,
        LOGGER_CONTEXT,
      );
      this.metrics.incrementFailed(routingKey);

      try {
        channel.nack(message, false, false);
      } catch (nackError) {
        Logger.error(
          `Failed to NACK message ${routingKey}: ${(nackError as Error).message}`,
          undefined,
          LOGGER_CONTEXT,
        );
      }
    }
  }

  private async dispatchEvent(event: TaskEvent): Promise<void> {
    const handler = this.handlers[event.type];
    if (!handler) {
      throw new Error(`No handler registered for event type ${event.type}`);
    }

    await handler(event);
  }

  private async handleTaskCreated(event: TaskCreatedEvent): Promise<void> {
    const recipients = await this.notifications.handleTaskCreated(event);
    if (recipients.length > 0) {
      this.ws.emitToUsers('task:created', event, recipients);
    }
  }

  private async handleTaskUpdated(event: TaskUpdatedEvent): Promise<void> {
    const recipients = await this.notifications.handleTaskUpdated(event);
    if (recipients.length > 0) {
      this.ws.emitToUsers('task:updated', event, recipients);
    }
  }

  private async handleTaskCommentCreated(event: TaskCommentCreatedEvent): Promise<void> {
    const recipients = await this.notifications.handleTaskCommentCreated(event);
    if (recipients.length > 0) {
      this.ws.emitToUsers('comment:new', event, recipients);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
