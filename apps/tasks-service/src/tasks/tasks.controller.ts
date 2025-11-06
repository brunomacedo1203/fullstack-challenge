import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { ListCommentsQueryDto } from './dto/list-comments.query.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  list(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('size', new ParseIntPipe({ optional: true })) size?: number,
  ) {
    return this.tasksService.list(page ?? 1, size ?? 10);
  }

  @Get(':id/comments')
  listComments(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query() query: ListCommentsQueryDto,
  ) {
    return this.tasksService.listComments(id, query);
  }

  @Get(':id')
  getById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.tasksService.getById(id);
  }

  @Get(':id/history')
  listHistory(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query() query: ListCommentsQueryDto,
  ) {
    return this.tasksService.listHistory(id, query);
  }

  @Post()
  create(@Body() dto: CreateTaskDto, @Headers('x-user-id') userId?: string) {
    return this.tasksService.create(dto, userId);
  }

  @Put(':id')
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateTaskDto,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.tasksService.update(id, dto, userId);
  }

  @Delete(':id')
  delete(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.tasksService.delete(id);
  }

  @Post(':id/comments')
  createComment(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: CreateCommentDto,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.tasksService.createComment(id, dto, userId);
  }
}
