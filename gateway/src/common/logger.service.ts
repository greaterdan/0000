import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface LogContext {
  userId?: string;
  accountId?: string;
  transactionId?: string;
  service?: string;
  operation?: string;
  [key: string]: any;
}

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logger: NestLoggerService;

  constructor(private configService: ConfigService) {
    this.logger = new (require('winston').createLogger)({
      level: this.configService.get('LOG_LEVEL', 'info'),
      format: require('winston').format.combine(
        require('winston').format.timestamp(),
        require('winston').format.errors({ stack: true }),
        require('winston').format.json()
      ),
      defaultMeta: {
        service: 'gateway',
        version: '1.0.0',
        environment: this.configService.get('NODE_ENV', 'development'),
      },
      transports: [
        new (require('winston').transports.Console)({
          format: require('winston').format.combine(
            require('winston').format.colorize(),
            require('winston').format.simple()
          ),
        }),
        ...(this.configService.get('NODE_ENV') === 'production' ? [
          new (require('winston').transports.File)({
            filename: 'logs/error.log',
            level: 'error',
          }),
          new (require('winston').transports.File)({
            filename: 'logs/combined.log',
          }),
        ] : []),
      ],
    });
  }

  log(message: string, context?: LogContext) {
    this.logger.log('info', message, context);
  }

  error(message: string, trace?: string, context?: LogContext) {
    this.logger.error(message, { trace, ...context });
  }

  warn(message: string, context?: LogContext) {
    this.logger.warn(message, context);
  }

  debug(message: string, context?: LogContext) {
    this.logger.debug(message, context);
  }

  verbose(message: string, context?: LogContext) {
    this.logger.verbose(message, context);
  }

  // Business-specific logging methods
  logTransaction(operation: string, details: any, context?: LogContext) {
    this.log(`Transaction: ${operation}`, {
      operation,
      ...details,
      ...context,
    });
  }

  logSecurity(event: string, details: any, context?: LogContext) {
    this.warn(`Security Event: ${event}`, {
      securityEvent: event,
      ...details,
      ...context,
    });
  }

  logPerformance(operation: string, duration: number, context?: LogContext) {
    this.log(`Performance: ${operation}`, {
      operation,
      duration,
      ...context,
    });
  }

  logError(error: any, context?: LogContext) {
    this.error(`Error: ${error.message || error}`, error.stack, context);
  }

  logDatabase(operation: string, table: string, duration: number, details?: any) {
    this.log(`Database: ${operation} on ${table}`, {
      operation,
      table,
      duration,
      ...details,
    });
  }

  logExternalService(service: string, operation: string, duration: number, status: string) {
    this.log(`External Service: ${service} - ${operation}`, {
      service,
      operation,
      duration,
      status,
    });
  }

  logBusinessEvent(eventType: string, details?: any) {
    this.log(`Business Event: ${eventType}`, {
      eventType,
      ...details,
    });
  }

  logHealth(component: string, details?: any) {
    this.log(`Health Check: ${component}`, {
      component,
      ...details,
    });
  }
}
