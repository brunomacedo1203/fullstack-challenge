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
    this.handlers = {
      'task.created': async (event) => this.handleTaskCreated(event as TaskCreatedEvent),
      'task.updated': async (event) => this.handleTaskUpdated(event as TaskUpdatedEvent),
      'task.comment.created': async (event) =>
        this.handleTaskCommentCreated(event as TaskCommentCreatedEvent),
    };
  }

  async onModuleInit(): Promise<void> {
    await this.setupConsumer();
  }

  async onModuleDestroy(): Promise<void> {
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

  private async setupConsumer(): Promise<void> {
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

    Logger.log(
      `RabbitMQ consumer ready (queue=${this.queue}, pattern=${this.routingPattern})`,
      LOGGER_CONTEXT,
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
      channel.ack(message);
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
}
