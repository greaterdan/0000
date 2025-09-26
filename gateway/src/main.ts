import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RateLimitGuard } from './common/guards/rate-limit.guard';
import { LoggerService } from './common/logger.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Use structured logging
  const logger = app.get(LoggerService);
  app.useLogger(logger);
  
  // Enable CORS with production settings
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? process.env.ALLOWED_ORIGINS?.split(',') : true,
    credentials: true,
  });
  
  // Add security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });
  
  // Enable global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());
  
  // Enable rate limiting
  app.useGlobalGuards(new RateLimitGuard());
  
  // Enable validation pipes
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
  
  // Add root health endpoint for Railway BEFORE setting global prefix
  app.use('/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'gateway',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  });
  
  // Set global prefix
  app.setGlobalPrefix('api');
  
  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('AIM Currency API')
    .setDescription('AI-Powered Digital Currency Infrastructure API')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'Authentication and authorization endpoints')
    .addTag('Transfers', 'Transfer AIM tokens between accounts')
    .addTag('Balance', 'Check account balances')
    .addTag('Jobs', 'Submit and manage AI jobs')
    .addTag('Rates', 'Get current exchange rates')
    .addTag('Health', 'Health check endpoints')
    .addTag('Metrics', 'Prometheus metrics endpoints')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  logger.log(`Gateway service started successfully`, {
    port,
    environment: process.env.NODE_ENV || 'development',
    healthCheckUrl: `http://localhost:${port}/api/health`
  });
}

bootstrap().catch((error) => {
  const logger = new LoggerService({ get: () => 'error' } as any);
  logger.error('Failed to start gateway service', error.stack, {
    error: error.message,
    service: 'gateway'
  });
  process.exit(1);
});
