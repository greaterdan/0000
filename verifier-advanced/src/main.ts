import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // CORS configuration
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3007'],
    credentials: true,
  });

  const port = process.env.VERIFIER_ADVANCED_PORT || 3014;
  await app.listen(port);
  console.log(`Advanced verifier service listening on port ${port}`);
}

bootstrap();
