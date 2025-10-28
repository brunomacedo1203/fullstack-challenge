import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

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
  app.enableCors({ origin: '*' });

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
