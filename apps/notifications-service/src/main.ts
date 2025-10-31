import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new WsAdapter(app));

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
