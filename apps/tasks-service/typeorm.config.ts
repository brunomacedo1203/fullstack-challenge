import 'reflect-metadata';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { join } from 'node:path';
import { Task } from './src/tasks/entities/task.entity';
import { TaskAssignee } from './src/tasks/entities/task-assignee.entity';
import { Comment } from './src/tasks/entities/comment.entity';
import { TaskHistory } from './src/tasks/entities/task-history.entity';

// Initialize ConfigModule to read env for CLI usage
// Prefer app-scoped env files when running via CLI, then fall back to repo root
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: [
    // app-local
    join(__dirname, `.env.${process.env.NODE_ENV ?? 'development'}`),
    join(__dirname, '.env.local'),
    join(__dirname, '.env'),
    // repo root
    `.env.${process.env.NODE_ENV ?? 'development'}`,
    '.env.local',
    '.env',
  ],
  expandVariables: true,
});

const configService = new ConfigService();

const isProd = process.env.NODE_ENV === 'production';

export default new DataSource({
  type: 'postgres',
  host: configService.get<string>('DATABASE_HOST', 'localhost'),
  port: Number(configService.get<string>('DATABASE_PORT', '5432')),
  username: configService.get<string>('DATABASE_USER', 'postgres'),
  password: configService.get<string>('DATABASE_PASSWORD', 'password'),
  database: configService.get<string>('DATABASE_NAME', 'challenge_db'),
  entities: [Task, TaskAssignee, Comment, TaskHistory],
  migrations: isProd ? [join(__dirname, 'migrations/*.js')] : [join(__dirname, 'migrations/*.ts')],
});
