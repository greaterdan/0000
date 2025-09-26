import { ConfigService } from '@nestjs/config';
import { LoggerService } from './logger.service';
export declare class MetricsService {
    private configService;
    private logger;
    private register;
    private httpRequestDuration;
    private httpRequestTotal;
    private activeConnections;
    private transferAmount;
    private transferCount;
    private errorCount;
    private databaseOperations;
    private externalServiceCalls;
    private businessMetrics;
    private systemMetrics;
    private securityEvents;
    private performanceMetrics;
    constructor(configService: ConfigService, logger: LoggerService);
    recordHttpRequest(method: string, route: string, statusCode: number, duration: number): void;
    incrementActiveConnections(): void;
    decrementActiveConnections(): void;
    recordTransfer(fromKind: string, toKind: string, amount: number, status: string): void;
    recordError(service: string, errorType: string): void;
    getMetrics(): Promise<string>;
    recordDatabaseOperation(operation: string, table: string, duration: number, status: string): void;
    recordExternalServiceCall(service: string, operation: string, duration: number, status: string): void;
    recordBusinessEvent(eventType: string, accountKind: string, status: string): void;
    updateSystemHealth(component: string, score: number): void;
    recordSecurityEvent(eventType: string, severity: string, source: string): void;
    updatePerformanceIndicator(indicator: string, component: string, value: number): void;
    getHealthMetrics(): {
        uptime: number;
        memory: {
            rss: number;
            heapTotal: number;
            heapUsed: number;
            external: number;
            arrayBuffers: number;
        };
        cpu: {
            user: number;
            system: number;
        };
        timestamp: string;
        version: string;
        platform: NodeJS.Platform;
        arch: NodeJS.Architecture;
    };
    getAllMetrics(): Promise<string>;
    getMetricsSummary(): {
        httpRequests: any;
        activeConnections: any;
        transfers: any;
        errors: any;
        businessEvents: any;
        securityEvents: any;
        systemHealth: any;
        performance: any;
    };
}
