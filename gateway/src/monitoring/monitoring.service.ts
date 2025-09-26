import { Injectable } from '@nestjs/common';
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

@Injectable()
export class MonitoringService {
  private readonly serviceName = 'gateway';
  private readonly version = '1.0.0';
  private readonly startTime = Date.now();

  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
    private metrics: MetricsService,
    private errorTracking: ErrorTrackingService,
    private health: HealthService
  ) {}

  async getDashboard(): Promise<MonitoringDashboard> {
    try {
      const [healthCheck, errorStats] = await Promise.all([
        this.health.getHealth(),
        this.errorTracking.getErrorStatistics(),
      ]);

      const systemMetrics = this.getSystemMetrics();
      const businessMetrics = this.getBusinessMetrics();
      const performanceMetrics = this.getPerformanceMetrics();
      const securityMetrics = this.getSecurityMetrics();
      const serviceStatuses = this.getServiceStatuses(healthCheck);

      const dashboard: MonitoringDashboard = {
        overview: {
          status: healthCheck.status,
          uptime: Math.floor((Date.now() - this.startTime) / 1000),
          version: this.version,
          environment: this.configService.get('NODE_ENV', 'development'),
          lastUpdated: new Date().toISOString(),
        },
        system: systemMetrics,
        business: businessMetrics,
        errors: {
          total: errorStats.total,
          last24Hours: errorStats.last24Hours,
          last7Days: errorStats.last7Days,
          severityCounts: errorStats.severityCounts,
          topErrors: this.getTopErrors(errorStats.errorTypeCounts),
        },
        performance: performanceMetrics,
        security: securityMetrics,
        services: serviceStatuses,
      };

      this.logger.log('Monitoring dashboard generated', { 
        status: dashboard.overview.status,
        errorCount: dashboard.errors.total 
      });

      return dashboard;
    } catch (error) {
      this.logger.error('Failed to generate monitoring dashboard', error.stack);
      throw error;
    }
  }

  private getSystemMetrics() {
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal + memoryUsage.external;
    const usedMemory = memoryUsage.heapUsed;
    const memoryPercentage = (usedMemory / totalMemory) * 100;

    const cpuUsage = process.cpuUsage();
    const cpuPercentage = (cpuUsage.user + cpuUsage.system) / 1000000;

    return {
      memory: {
        used: usedMemory,
        total: totalMemory,
        percentage: memoryPercentage,
      },
      cpu: {
        usage: cpuPercentage,
      },
      disk: {
        used: 0, // Would be calculated using a disk usage library
        total: 0,
        percentage: 0,
      },
    };
  }

  private getBusinessMetrics() {
    // In a real implementation, these would be actual database queries
    return {
      activeAccounts: 0,
      totalTransfers: 0,
      systemLoad: 0,
      errorRate: 0,
    };
  }

  private getPerformanceMetrics() {
    // In a real implementation, these would be calculated from actual metrics
    return {
      averageResponseTime: 0,
      requestsPerSecond: 0,
      successRate: 0,
      throughput: 0,
    };
  }

  private getSecurityMetrics() {
    // In a real implementation, these would be calculated from security event metrics
    return {
      securityEvents: 0,
      failedAuthentications: 0,
      rateLimitHits: 0,
      suspiciousActivities: 0,
    };
  }

  private getServiceStatuses(healthCheck: any) {
    const services = [
      { name: 'database', status: healthCheck.checks.database.status, responseTime: healthCheck.checks.database.responseTime, lastChecked: healthCheck.checks.database.lastChecked },
      ...healthCheck.checks.externalServices.map((service: any) => ({
        name: service.name,
        status: service.status,
        responseTime: service.responseTime,
        lastChecked: service.lastChecked,
      })),
    ];

    return services;
  }

  private getTopErrors(errorTypeCounts: Record<string, number>) {
    return Object.entries(errorTypeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        count,
        lastOccurred: new Date().toISOString(), // Would be actual last occurrence time
      }));
  }

  // Get real-time metrics
  getRealTimeMetrics() {
    return {
      timestamp: new Date().toISOString(),
      system: this.getSystemMetrics(),
      performance: this.getPerformanceMetrics(),
      security: this.getSecurityMetrics(),
    };
  }

  // Get historical metrics (would be stored in a time-series database)
  getHistoricalMetrics(timeRange: string = '1h') {
    // In a real implementation, this would query a time-series database
    return {
      timeRange,
      data: [],
      message: 'Historical metrics not implemented in this demo',
    };
  }

  // Get alerts and notifications
  getAlerts() {
    // In a real implementation, this would check for various alert conditions
    const alerts = [];

    // Check for high error rate
    const errorStats = this.errorTracking.getErrorStatistics();
    if (errorStats.last24Hours > 100) {
      alerts.push({
        type: 'error_rate',
        severity: 'high',
        message: 'High error rate detected in the last 24 hours',
        count: errorStats.last24Hours,
      });
    }

    // Check for memory usage
    const systemMetrics = this.getSystemMetrics();
    if (systemMetrics.memory.percentage > 90) {
      alerts.push({
        type: 'memory_usage',
        severity: 'high',
        message: 'High memory usage detected',
        percentage: systemMetrics.memory.percentage,
      });
    }

    // Check for CPU usage
    if (systemMetrics.cpu.usage > 90) {
      alerts.push({
        type: 'cpu_usage',
        severity: 'high',
        message: 'High CPU usage detected',
        usage: systemMetrics.cpu.usage,
      });
    }

    return alerts;
  }
}
