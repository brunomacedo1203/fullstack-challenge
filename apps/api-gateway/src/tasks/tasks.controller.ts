import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TasksProxyService } from './tasks.service';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksProxy: TasksProxyService) {}

  @Get()
  list(@Query() query: Record<string, unknown>, @Req() req: Request): Promise<unknown> {
    return this.tasksProxy.list(query, req.headers.authorization);
  }

  @Get(':id')
  getById(@Param('id') id: string, @Req() req: Request): Promise<unknown> {
    return this.tasksProxy.getById(id, req.headers.authorization);
  }

  @Post()
  create(@Body() body: unknown, @Req() req: Request): Promise<unknown> {
    return this.tasksProxy.create(body, req.headers.authorization);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: unknown, @Req() req: Request): Promise<unknown> {
    return this.tasksProxy.update(id, body, req.headers.authorization);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: Request): Promise<unknown> {
    return this.tasksProxy.delete(id, req.headers.authorization);
  }
}
