import { Module } from '@nestjs/common';
import { TasksEventsConsumer } from './tasks-events.consumer';

@Module({
  providers: [TasksEventsConsumer],
})
export class EventsModule {}
