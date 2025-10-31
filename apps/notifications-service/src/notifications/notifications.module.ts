import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { TaskParticipants } from './task-participants.entity';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, TaskParticipants])],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
