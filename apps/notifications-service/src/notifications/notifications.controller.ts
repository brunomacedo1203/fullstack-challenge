import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  async list(
    @Query('recipientId') recipientId: string,
    @Query('size', new ParseIntPipe({ optional: true })) size = 10,
  ) {
    const data = await this.notifications.listUnread(recipientId, Math.min(size, 100));
    return { data, size: data.length };
  }
}
