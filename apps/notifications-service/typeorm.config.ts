import 'reflect-metadata';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { join } from 'node:path';
import { Notification } from './src/notifications/notification.entity';
import { TaskParticipants } from './src/notifications/task-participants.entity';

ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`, '.env.local', '.env'],
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
  entities: [Notification, TaskParticipants],
  migrations: isProd ? [join(__dirname, 'migrations/*.js')] : [join(__dirname, 'migrations/*.ts')],
});
