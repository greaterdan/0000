import { MonitoringService } from './monitoring.service';
export declare class MonitoringController {
    private readonly monitoringService;
    constructor(monitoringService: MonitoringService);
    getDashboard(): Promise<import("./monitoring.service").MonitoringDashboard>;
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
