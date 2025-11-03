import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { join } from 'path';

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
          // Ensure migrations are discoverable at runtime (dist/src/migrations/*.js)
          migrations: [join(__dirname, 'migrations/*.{js,ts}')],
          // Optionally run migrations at startup
          migrationsRun: parseBool(configService.get('MIGRATIONS_RUN'), false),
        } as const;
      },
    }),

    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}
