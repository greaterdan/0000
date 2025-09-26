import { ConfigService } from '@nestjs/config';
import { LoggerService } from './logger.service';
import { MetricsService } from './metrics.service';
export interface ErrorContext {
    userId?: string;
    accountId?: string;
    transactionId?: string;
    requestId?: string;
    correlationId?: string;
    userAgent?: string;
    ip?: string;
    endpoint?: string;
    method?: string;
    [key: string]: any;
}
export interface ErrorReport {
    id: string;
    timestamp: string;
    error: {
        name: string;
        message: string;
        stack?: string;
        code?: string;
    };
    context: ErrorContext;
    severity: 'low' | 'medium' | 'high' | 'critical';
    service: string;
    environment: string;
    version: string;
    resolved: boolean;
    tags: string[];
}
export declare class ErrorTrackingService {
    private configService;
    private logger;
    private metrics;
    private readonly serviceName;
    private readonly version;
    private errorReports;
    private readonly maxReports;
    constructor(configService: ConfigService, logger: LoggerService, metrics: MetricsService);
    trackError(error: Error, context?: ErrorContext, severity?: 'low' | 'medium' | 'high' | 'critical'): string;
    trackValidationError(error: Error, context: ErrorContext): string;
    trackAuthenticationError(error: Error, context: ErrorContext): string;
    trackAuthorizationError(error: Error, context: ErrorContext): string;
    trackDatabaseError(error: Error, context: ErrorContext): string;
    trackExternalServiceError(error: Error, context: ErrorContext): string;
    trackBusinessLogicError(error: Error, context: ErrorContext): string;
    trackSecurityError(error: Error, context: ErrorContext): string;
    getErrorReports(limit?: number): ErrorReport[];
    getErrorReport(errorId: string): ErrorReport | undefined;
    getErrorsBySeverity(severity: string): ErrorReport[];
    getErrorsByService(service: string): ErrorReport[];
    getErrorStatistics(): {
        total: number;
        last24Hours: number;
        last7Days: number;
        severityCounts: Record<string, number>;
        serviceCounts: Record<string, number>;
        errorTypeCounts: Record<string, number>;
        resolved: number;
        unresolved: number;
    };
    resolveError(errorId: string): boolean;
    clearOldReports(olderThanDays?: number): number;
    private generateErrorId;
    private generateTags;
    private storeErrorReport;
    private sendToExternalService;
}
