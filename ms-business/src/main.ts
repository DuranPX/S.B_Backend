import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { useContainer } from 'class-validator';



async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  // ValidationPipe global — activa class-validator en todos los DTOs.
  // whitelist: true  → elimina campos no declarados en el DTO (protección extra).
  // forbidNonWhitelisted: true → lanza error si llegan campos extra.
  // transform: true  → convierte tipos automáticamente (ej: string → number en query params).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
