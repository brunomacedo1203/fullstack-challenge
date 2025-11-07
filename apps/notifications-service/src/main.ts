import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WsAdapter } from '@nestjs/platform-ws';
import { ConfigService } from '@nestjs/config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new WsAdapter(app));

  // Enable CORS for HTTP endpoints (used by the web app to fetch unread notifications)
  const config = app.get(ConfigService);
  const originEnv = config.get<string>('CORS_ORIGIN', '*');
  const credentialsEnv = config.get<string>('CORS_CREDENTIALS', 'false');
  const credentials = ['1', 'true', 'yes', 'on'].includes(String(credentialsEnv).toLowerCase());

  let origin: true | string[] = true;
  if (originEnv && originEnv !== '*') {
    const list = originEnv
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (list.length) origin = list as string[];
  }

  app.enableCors({
    origin,
    credentials,
    // Let cors package reflect requested methods/headers automatically
    // to avoid case or header list mismatches during preflight
    maxAge: 86400,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT ?? 3004);
  await app.listen(port, '0.0.0.0');
  Logger.log(`Notifications service listening on port ${port}`, 'Bootstrap');
}

bootstrap().catch((error) => {
  Logger.error('Failed to bootstrap notifications service', error);
  process.exit(1);
});
