import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './core/filters/global-exception.filter';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ─── Body Size Limit ─────────────────────────────────────────────────────────
  // ต้องตั้งให้ >= UPLOAD_MAX_FILE_SIZE ใน .env (default 50MB)
  const bodyLimit = process.env.UPLOAD_MAX_FILE_SIZE
    ? `${Math.ceil(Number(process.env.UPLOAD_MAX_FILE_SIZE) / (1024 * 1024))}mb`
    : '50mb';

  app.use(express.json({ limit: bodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: bodyLimit }));

  // ─── Global Pipes & Filters ──────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ─── CORS & Prefix ───────────────────────────────────────────────────────────
  app.enableCors();
  app.setGlobalPrefix('api/v1');

  await app.listen(process.env.PORT ?? 5000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
