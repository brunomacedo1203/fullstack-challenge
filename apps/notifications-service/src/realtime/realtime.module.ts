import { Module } from '@nestjs/common';
import { WsGateway } from './ws.gateway';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [WsGateway],
  exports: [WsGateway],
})
export class RealtimeModule {}
