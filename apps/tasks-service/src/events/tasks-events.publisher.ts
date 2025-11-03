import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, Channel, ChannelModel, Options } from 'amqplib';
import {
  TaskCommentCreatedEvent,
  TaskCreatedEvent,
  TaskEvent,
  TaskUpdatedEvent,
} from '@jungle/types';

const LOGGER_CONTEXT = 'TasksEventsPublisher';

@Injectable()
export class TasksEventsPublisher implements OnModuleInit, OnModuleDestroy {
  private connectionModel?: ChannelModel;
  private channel?: Channel;
  private exchange: string;
  private connecting?: Promise<Channel>;
  private reconnecting = false;
  private isShuttingDown = false;
  private retryBaseMs: number;
  private retryMaxMs: number;

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    this.exchange = this.configService.get<string>('TASKS_EVENTS_EXCHANGE', 'tasks.events');
    this.retryBaseMs = Number(this.configService.get<string>('RABBITMQ_RETRY_BASE_MS', '500'));
    this.retryMaxMs = Number(this.configService.get<string>('RABBITMQ_RETRY_MAX_MS', '10000'));
  }

  async onModuleInit(): Promise<void> {
    await this.ensureChannel();
  }

  async onModuleDestroy(): Promise<void> {
    this.isShuttingDown = true;
    await this.channel?.close().catch((error: unknown) => {
      Logger.error(`Failed to close RabbitMQ channel: ${(error as Error).message}`, LOGGER_CONTEXT);
    });
    await this.connectionModel?.close().catch((error: unknown) => {
      Logger.error(
        `Failed to close RabbitMQ connection: ${(error as Error).message}`,
        LOGGER_CONTEXT,
      );
    });
  }

  async publishTaskCreated(event: TaskCreatedEvent): Promise<void> {
    await this.publish(event.type, event);
  }

  async publishTaskUpdated(event: TaskUpdatedEvent): Promise<void> {
    await this.publish(event.type, event);
  }

  async publishTaskCommentCreated(event: TaskCommentCreatedEvent): Promise<void> {
    await this.publish(event.type, event);
  }

  private async publish(routingKey: string, event: TaskEvent): Promise<void> {
    try {
      const channel = await this.ensureChannel();
      const payload = Buffer.from(JSON.stringify(event));
      const publishOptions: Options.Publish = {
        contentType: 'application/json',
        persistent: true,
      };

      channel.publish(this.exchange, routingKey, payload, publishOptions);
    } catch (error) {
      Logger.error(
        `Failed to publish event ${routingKey}: ${(error as Error).message}`,
        LOGGER_CONTEXT,
      );
    }
  }

  private async ensureChannel(): Promise<Channel> {
    if (this.channel && this.connectionModel) {
      return this.channel;
    }

    if (!this.connecting) {
      this.connecting = this.connectWithRetry();
    }

    try {
      const ch = await this.connecting;
      return ch;
    } finally {
      this.connecting = undefined;
    }
  }

  private async connectWithRetry(): Promise<Channel> {
    let delay = this.retryBaseMs;
    const url = this.configService.get<string>('RABBITMQ_URL', 'amqp://localhost:5672');

    while (!this.isShuttingDown) {
      try {
        const connection = await connect(url);
        const channel = await connection.createChannel();
        await channel.assertExchange(this.exchange, 'topic', { durable: true });

        // Attach listeners for resilience
        const safeOn = (emitter: any, event: string, handler: (...args: any[]) => void) => {
          if (emitter && typeof emitter.on === 'function') {
            try {
              emitter.on(event, handler);
            } catch {
              /* noop */
            }
          }
        };

        safeOn(connection as any, 'close', () => this.scheduleReconnect('connection_close'));
        safeOn(connection as any, 'error', () => this.scheduleReconnect('connection_error'));
        safeOn(channel as any, 'close', () => this.scheduleReconnect('channel_close'));
        safeOn(channel as any, 'error', () => this.scheduleReconnect('channel_error'));

        this.connectionModel = connection as unknown as ChannelModel;
        this.channel = channel;
        Logger.log('RabbitMQ channel established for publisher', LOGGER_CONTEXT);
        return channel;
      } catch (err) {
        Logger.warn(
          `RabbitMQ connect failed: ${(err as Error).message}. Retrying in ${delay}ms`,
          LOGGER_CONTEXT,
        );
        await this.sleep(delay);
        delay = Math.min(this.retryMaxMs, Math.floor(delay * 1.5));
      }
    }

    throw new Error('Publisher is shutting down');
  }

  private scheduleReconnect(origin: string): void {
    if (this.isShuttingDown) return;
    if (this.reconnecting) return;
    this.reconnecting = true;
    this.channel = undefined;
    this.connectionModel = undefined;
    Logger.warn(`Scheduling RabbitMQ reconnect (origin=${origin})`, LOGGER_CONTEXT);
    // Fire and forget; subsequent publish() calls will await ensureChannel()
    this.connectWithRetry()
      .catch((err) => Logger.error(`Reconnect failed: ${(err as Error).message}`, LOGGER_CONTEXT))
      .finally(() => {
        this.reconnecting = false;
      });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
