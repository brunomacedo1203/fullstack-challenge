import { Module } from '@nestjs/common';
import { TasksEventsConsumer } from './tasks-events.consumer';
import { NotificationsModule } from '../notifications/notifications.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [NotificationsModule, RealtimeModule, MetricsModule],
  providers: [TasksEventsConsumer],
})
export class EventsModule {}
