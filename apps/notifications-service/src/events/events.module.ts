import { Module } from '@nestjs/common';
import { TasksEventsConsumer } from './tasks-events.consumer';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [TasksEventsConsumer],
})
export class EventsModule {}
