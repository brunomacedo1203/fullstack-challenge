import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsModule } from './events/events.module';
import { HealthModule } from './health/health.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RealtimeModule } from './realtime/realtime.module';
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`, '.env.local', '.env'],
      expandVariables: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const parseBool = (v: unknown, def = false) => {
          if (typeof v === 'string') return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase());
          if (typeof v === 'number') return v === 1;
          if (typeof v === 'boolean') return v;
          return def;
        };

        return {
          type: 'postgres',
          host: configService.get<string>('DATABASE_HOST', 'localhost'),
          port: Number(configService.get<string>('DATABASE_PORT', '5432')),
          username: configService.get<string>('DATABASE_USER', 'postgres'),
          password: configService.get<string>('DATABASE_PASSWORD', 'password'),
          database: configService.get<string>('DATABASE_NAME', 'challenge_db'),
          autoLoadEntities: true,
          synchronize: false,
          migrationsRun: parseBool(configService.get('MIGRATIONS_RUN'), false),
        } as const;
      },
    }),
    HealthModule,
    NotificationsModule,
    RealtimeModule,
    MetricsModule,
    EventsModule,
  ],
})
export class AppModule {}
