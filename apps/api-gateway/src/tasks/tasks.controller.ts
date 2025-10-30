import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
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
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

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
  getById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request,
  ): Promise<unknown> {
    return this.tasksProxy.getById(id, req.headers.authorization);
  }

  @Post()
  create(@Body() body: CreateTaskDto, @Req() req: Request): Promise<unknown> {
    return this.tasksProxy.create(body, req.headers.authorization);
  }

  @Put(':id')
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: UpdateTaskDto,
    @Req() req: Request,
  ): Promise<unknown> {
    return this.tasksProxy.update(id, body, req.headers.authorization);
  }

  @Delete(':id')
  delete(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request,
  ): Promise<unknown> {
    return this.tasksProxy.delete(id, req.headers.authorization);
  }
}
