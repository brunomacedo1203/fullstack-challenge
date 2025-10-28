import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TasksController } from './tasks.controller';
import { TasksProxyService } from './tasks.service';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.get<string>('TASKS_SERVICE_URL', 'http://tasks-service:3003'),
        timeout: Number(configService.get('HTTP_TIMEOUT_MS') ?? 5000),
      }),
    }),
  ],
  controllers: [TasksController],
  providers: [TasksProxyService, JwtAuthGuard],
})
export class TasksModule {}
