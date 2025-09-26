import { LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export interface LogContext {
    userId?: string;
    accountId?: string;
    transactionId?: string;
    service?: string;
    operation?: string;
    [key: string]: any;
}
export declare class LoggerService implements NestLoggerService {
    private configService;
    private readonly logger;
    constructor(configService: ConfigService);
    log(message: string, context?: LogContext): void;
    error(message: string, trace?: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    debug(message: string, context?: LogContext): void;
    verbose(message: string, context?: LogContext): void;
    logTransaction(operation: string, details: any, context?: LogContext): void;
    logSecurity(event: string, details: any, context?: LogContext): void;
    logPerformance(operation: string, duration: number, context?: LogContext): void;
    logError(error: any, context?: LogContext): void;
    logDatabase(operation: string, table: string, duration: number, details?: any): void;
    logExternalService(service: string, operation: string, duration: number, status: string): void;
    logBusinessEvent(eventType: string, details?: any): void;
    logHealth(component: string, details?: any): void;
}
