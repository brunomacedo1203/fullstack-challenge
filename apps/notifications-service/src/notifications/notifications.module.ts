import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { TaskParticipants } from './task-participants.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { JwtHttpAuthGuard } from '../auth/jwt-http.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, TaskParticipants])],
  providers: [NotificationsService, JwtHttpAuthGuard],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
