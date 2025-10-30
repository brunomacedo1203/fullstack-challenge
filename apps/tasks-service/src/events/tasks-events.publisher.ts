import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, Channel, Connection, Options } from 'amqplib';
import {
  TaskCommentCreatedEvent,
  TaskCreatedEvent,
  TaskEvent,
  TaskUpdatedEvent,
} from '@jungle/types';

const LOGGER_CONTEXT = 'TasksEventsPublisher';

@Injectable()
export class TasksEventsPublisher implements OnModuleInit, OnModuleDestroy {
  private connection?: Connection;
  private channel?: Channel;
  private exchange: string;

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    this.exchange = this.configService.get<string>('TASKS_EVENTS_EXCHANGE', 'tasks.events');
  }

  async onModuleInit(): Promise<void> {
    await this.ensureChannel();
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close().catch((error: unknown) => {
      Logger.error(`Failed to close RabbitMQ channel: ${(error as Error).message}`, LOGGER_CONTEXT);
    });
    await this.connection?.close().catch((error: unknown) => {
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
    if (!this.channel || !this.connection) {
      const url = this.configService.get<string>('RABBITMQ_URL', 'amqp://localhost:5672');
      this.connection = await connect(url);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
    }

    return this.channel;
  }
}
