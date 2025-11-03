import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS configuration via env
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
  app.enableCors({ origin, credentials });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Jungle Gaming API Gateway')
    .setDescription('REST gateway aggregating backend microservices')
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port, '0.0.0.0');
}

bootstrap().catch((error) => {
  console.error('Failed to bootstrap API Gateway', error);
  process.exit(1);
});
