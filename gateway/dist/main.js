"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const rate_limit_guard_1 = require("./common/guards/rate-limit.guard");
const logger_service_1 = require("./common/logger.service");
const swagger_1 = require("@nestjs/swagger");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const logger = app.get(logger_service_1.LoggerService);
    app.useLogger(logger);
    app.enableCors({
        origin: process.env.NODE_ENV === 'production' ? process.env.ALLOWED_ORIGINS?.split(',') : true,
        credentials: true,
    });
    app.use((req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        next();
    });
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalGuards(new rate_limit_guard_1.RateLimitGuard());
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
    }));
    app.use('/health', (req, res) => {
        res.json({
            status: 'healthy',
            service: 'gateway',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
        });
    });
    app.setGlobalPrefix('api');
    const config = new swagger_1.DocumentBuilder()
        .setTitle('AIM Currency API')
        .setDescription('AI-Powered Digital Currency Infrastructure API')
        .setVersion('1.0.0')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
    }, 'JWT-auth')
        .addTag('Authentication', 'Authentication and authorization endpoints')
        .addTag('Transfers', 'Transfer AIM tokens between accounts')
        .addTag('Balance', 'Check account balances')
        .addTag('Jobs', 'Submit and manage AI jobs')
        .addTag('Rates', 'Get current exchange rates')
        .addTag('Health', 'Health check endpoints')
        .addTag('Metrics', 'Prometheus metrics endpoints')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
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
    const logger = new logger_service_1.LoggerService({ get: () => 'error' });
    logger.error('Failed to start gateway service', error.stack, {
        error: error.message,
        service: 'gateway'
    });
    process.exit(1);
});
//# sourceMappingURL=main.js.map