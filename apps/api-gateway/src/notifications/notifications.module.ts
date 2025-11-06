import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { NotificationsProxyService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Module({
  imports: [ConfigModule, HttpModule],
  controllers: [NotificationsController],
  providers: [NotificationsProxyService, JwtAuthGuard],
})
export class NotificationsModule {}
