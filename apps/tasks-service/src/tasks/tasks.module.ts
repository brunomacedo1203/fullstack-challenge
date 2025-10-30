import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsModule } from '../events/events.module';
import { Comment } from './entities/comment.entity';
import { Task } from './entities/task.entity';
import { TaskAssignee } from './entities/task-assignee.entity';
import { TaskHistory } from './entities/task-history.entity';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [TypeOrmModule.forFeature([Task, TaskAssignee, Comment, TaskHistory]), EventsModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
