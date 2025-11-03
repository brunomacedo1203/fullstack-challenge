import { Controller, Get, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ListNotificationsQueryDto } from './dto/list-notifications.query.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  async list(@Query() query: ListNotificationsQueryDto) {
    const size = query.size ?? 10;
    const data = await this.notifications.listUnread(query.recipientId, Math.min(size, 100));
    return { data, size: data.length };
  }
}
