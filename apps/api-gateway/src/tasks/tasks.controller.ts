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
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { TasksProxyService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks.query.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ListCommentsQueryDto } from './dto/list-comments.query.dto';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksProxy: TasksProxyService) {}

  @Get()
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Página (default 1)',
    schema: { type: 'integer', minimum: 1, example: 1 },
  })
  @ApiQuery({
    name: 'size',
    required: false,
    description: 'Tamanho da página (default 10, max 100)',
    schema: { type: 'integer', minimum: 1, maximum: 100, example: 10 },
  })
  list(@Query() query: ListTasksQueryDto, @Req() req: Request): Promise<unknown> {
    const userId = this.extractUserId(req);
    return this.tasksProxy.list(query, req.headers.authorization, userId);
  }

  @Get(':id')
  getById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request,
  ): Promise<unknown> {
    const userId = this.extractUserId(req);
    return this.tasksProxy.getById(id, req.headers.authorization, userId);
  }

  @Post()
  create(@Body() body: CreateTaskDto, @Req() req: Request): Promise<unknown> {
    const userId = this.extractUserId(req);
    return this.tasksProxy.create(body, req.headers.authorization, userId);
  }

  @Put(':id')
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: UpdateTaskDto,
    @Req() req: Request,
  ): Promise<unknown> {
    const userId = this.extractUserId(req);
    return this.tasksProxy.update(id, body, req.headers.authorization, userId);
  }

  @Delete(':id')
  delete(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request,
  ): Promise<unknown> {
    const userId = this.extractUserId(req);
    return this.tasksProxy.delete(id, req.headers.authorization, userId);
  }

  @Get(':id/comments')
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Página (default 1)',
    schema: { type: 'integer', minimum: 1, example: 1 },
  })
  @ApiQuery({
    name: 'size',
    required: false,
    description: 'Itens por página (default 10, max 100)',
    schema: { type: 'integer', minimum: 1, maximum: 100, example: 10 },
  })
  listComments(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query() query: ListCommentsQueryDto,
    @Req() req: Request,
  ): Promise<unknown> {
    const userId = this.extractUserId(req);
    return this.tasksProxy.listComments(id, query, req.headers.authorization, userId);
  }

  @Post(':id/comments')
  createComment(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: CreateCommentDto,
    @Req() req: Request,
  ): Promise<unknown> {
    const userId = this.extractUserId(req);
    return this.tasksProxy.createComment(id, body, req.headers.authorization, userId);
  }

  private extractUserId(req: Request): string | undefined {
    const payload = req.user as JwtPayload | undefined;
    return payload?.sub;
  }
}
