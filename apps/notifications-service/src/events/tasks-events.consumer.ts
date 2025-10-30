import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Channel, ChannelModel, ConsumeMessage, Options, connect } from 'amqplib';

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

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    this.exchange = this.configService.get<string>('TASKS_EVENTS_EXCHANGE', 'tasks.events');
    this.queue = this.configService.get<string>('NOTIFICATIONS_QUEUE', 'notifications.q');
    this.routingPattern = this.configService.get<string>('TASKS_EVENTS_ROUTING', 'task.*');
    this.deadLetterExchange = this.configService.get<string>('NOTIFICATIONS_DLX');
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
    await channel.bindQueue(this.queue, this.exchange, this.routingPattern);
    await channel.prefetch(10);

    await channel.consume(
      this.queue,
      async (message) => {
        try {
          await this.handleMessage(channel, message);
        } catch (error) {
          Logger.error(
            `Failed to handle message ${message?.fields.routingKey ?? 'unknown'}: ${
              (error as Error).message
            }`,
            undefined,
            LOGGER_CONTEXT,
          );

          if (message) {
            channel.nack(message, false, false);
          }
        }
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

  private async handleMessage(channel: Channel, message: ConsumeMessage | null): Promise<void> {
    if (!message) {
      return;
    }

    const { routingKey } = message.fields;
    const payload = message.content.toString('utf-8');

    const preview =
      payload.length > MAX_LOG_PAYLOAD_LENGTH
        ? `${payload.slice(0, MAX_LOG_PAYLOAD_LENGTH)}…`
        : payload;

    Logger.log(`Received ${routingKey}: ${preview}`, LOGGER_CONTEXT);

    try {
      channel.ack(message);
    } catch (error) {
      Logger.error(
        `Failed to ACK message ${routingKey}: ${(error as Error).message}`,
        undefined,
        LOGGER_CONTEXT,
      );
      channel.nack(message, false, false);
    }
  }
}
