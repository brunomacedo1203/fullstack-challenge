import {
  Controller,
  Get,
  Patch,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { ListNotificationsQueryDto } from './dto/list-notifications.query.dto';
import { JwtHttpAuthGuard } from '../auth/jwt-http.guard';
import { Request } from 'express';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @UseGuards(JwtHttpAuthGuard)
  @ApiBearerAuth()
  async list(@Query() query: ListNotificationsQueryDto, @Req() req: Request) {
    const size = query.size ?? 10;
    const userId = (req as any).user?.sub as string | undefined;
    if (!userId) {
      // Guard should prevent this, but keep a safe check
      return { data: [], size: 0 };
    }
    const data = await this.notifications.listUnread(userId, Math.min(size, 100));
    return { data, size: data.length };
  }

  @Patch(':id/read')
  @UseGuards(JwtHttpAuthGuard)
  @ApiBearerAuth()
  async markAsRead(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.sub as string | undefined;
    if (!userId) return { ok: false };
    const updated = await this.notifications.markAsRead(id, userId);
    return { id: updated.id, readAt: updated.readAt };
  }
}
