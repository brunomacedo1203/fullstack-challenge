import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersController } from './users.controller';
import { UsersProxyService } from './users.service';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.get<string>('AUTH_SERVICE_URL', 'http://auth-service:3002'),
        timeout: Number(configService.get('HTTP_TIMEOUT_MS') ?? 5000),
      }),
    }),
  ],
  controllers: [UsersController],
  providers: [UsersProxyService, JwtAuthGuard],
})
export class UsersModule {}
