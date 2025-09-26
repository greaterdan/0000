import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for development
  app.enableCors({
    origin: true,
    credentials: true,
  });
  
  const port = process.env.TREASURY_PORT || 3004;
  await app.listen(port);
  
  console.log(`Treasury service running on port ${port}`);
  console.log(`Total Supply: 100M AIM`);
  console.log(`Public Sale: 50M AIM (50%)`);
  console.log(`Treasury Reserves: $50M USD`);
}

bootstrap();
