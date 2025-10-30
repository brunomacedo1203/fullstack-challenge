import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TasksEventsPublisher } from './tasks-events.publisher';

@Module({
  imports: [ConfigModule],
  providers: [TasksEventsPublisher],
  exports: [TasksEventsPublisher],
})
export class EventsModule {}
