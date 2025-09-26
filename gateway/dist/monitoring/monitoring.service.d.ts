import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../common/logger.service';
import { MetricsService } from '../common/metrics.service';
import { ErrorTrackingService } from '../common/error-tracking.service';
import { HealthService } from '../health/health.service';
export interface MonitoringDashboard {
    overview: {
        status: string;
        uptime: number;
        version: string;
        environment: string;
        lastUpdated: string;
    };
    system: {
        memory: {
            used: number;
            total: number;
            percentage: number;
        };
        cpu: {
            usage: number;
        };
        disk: {
            used: number;
            total: number;
            percentage: number;
        };
    };
    business: {
        activeAccounts: number;
        totalTransfers: number;
        systemLoad: number;
        errorRate: number;
    };
    errors: {
        total: number;
        last24Hours: number;
        last7Days: number;
        severityCounts: Record<string, number>;
        topErrors: Array<{
            name: string;
            count: number;
            lastOccurred: string;
        }>;
    };
    performance: {
        averageResponseTime: number;
        requestsPerSecond: number;
        successRate: number;
        throughput: number;
    };
    security: {
        securityEvents: number;
        failedAuthentications: number;
        rateLimitHits: number;
        suspiciousActivities: number;
    };
    services: Array<{
        name: string;
        status: string;
        responseTime: number;
        lastChecked: string;
    }>;
}
export declare class MonitoringService {
    private configService;
    private logger;
    private metrics;
    private errorTracking;
    private health;
    private readonly serviceName;
    private readonly version;
    private readonly startTime;
    constructor(configService: ConfigService, logger: LoggerService, metrics: MetricsService, errorTracking: ErrorTrackingService, health: HealthService);
    getDashboard(): Promise<MonitoringDashboard>;
    private getSystemMetrics;
    private getBusinessMetrics;
    private getPerformanceMetrics;
    private getSecurityMetrics;
    private getServiceStatuses;
    private getTopErrors;
    getRealTimeMetrics(): {
        timestamp: string;
        system: {
            memory: {
                used: number;
                total: number;
                percentage: number;
            };
            cpu: {
                usage: number;
            };
            disk: {
                used: number;
                total: number;
                percentage: number;
            };
        };
        performance: {
            averageResponseTime: number;
            requestsPerSecond: number;
            successRate: number;
            throughput: number;
        };
        security: {
            securityEvents: number;
            failedAuthentications: number;
            rateLimitHits: number;
            suspiciousActivities: number;
        };
    };
    getHistoricalMetrics(timeRange?: string): {
        timeRange: string;
        data: any[];
        message: string;
    };
    getAlerts(): any[];
}
