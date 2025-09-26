import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { LoggerService } from '../common/logger.service';
import { MetricsService } from '../common/metrics.service';
export interface HealthCheck {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: string;
    version: string;
    uptime: number;
    checks: {
        database: ServiceCheck;
        externalServices: ServiceCheck[];
        system: SystemCheck;
        business: BusinessCheck;
    };
}
export interface ServiceCheck {
    name: string;
    status: 'healthy' | 'unhealthy' | 'degraded';
    responseTime?: number;
    error?: string;
    lastChecked: string;
}
export interface SystemCheck {
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
}
export interface BusinessCheck {
    activeAccounts: number;
    totalTransfers: number;
    systemLoad: number;
    errorRate: number;
}
export declare class HealthService {
    private configService;
    private httpService;
    private logger;
    private metrics;
    private readonly serviceName;
    private readonly version;
    private readonly startTime;
    constructor(configService: ConfigService, httpService: HttpService, logger: LoggerService, metrics: MetricsService);
    getHealth(): Promise<HealthCheck>;
    private checkDatabase;
    private checkExternalServices;
    private checkService;
    private checkSystem;
    private checkBusiness;
    private determineOverallStatus;
    private getHealthScore;
    private createFailedCheck;
    private createFailedSystemCheck;
    private createFailedBusinessCheck;
}
