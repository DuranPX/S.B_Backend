import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { useContainer } from 'class-validator';
import * as bodyParser from 'body-parser';



async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(bodyParser.json({ limit: '5mb' }));
  app.use(bodyParser.urlencoded({ limit: '5mb', extended: true }));
  app.setGlobalPrefix('api');
  app.enableCors();
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
