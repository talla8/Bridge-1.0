import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:5141', 'https://localhost:7052'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe());
  app.use(
    '/uploads',
    express.static(join(process.cwd(), 'uploads')),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
