import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { LoggerService } from '../common/logger.service';
import { MetricsService } from '../common/metrics.service';
import { firstValueFrom } from 'rxjs';

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

@Injectable()
export class HealthService {
  private readonly serviceName = 'gateway';
  private readonly version = '1.0.0';
  private readonly startTime = Date.now();

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private logger: LoggerService,
    private metrics: MetricsService
  ) {}

  async getHealth(): Promise<HealthCheck> {
    const timestamp = new Date().toISOString();
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);

    try {
      // Run all health checks in parallel
      const [databaseCheck, externalServicesCheck, systemCheck, businessCheck] = await Promise.allSettled([
        this.checkDatabase(),
        this.checkExternalServices(),
        this.checkSystem(),
        this.checkBusiness(),
      ]);

      const checks = {
        database: databaseCheck.status === 'fulfilled' ? databaseCheck.value : this.createFailedCheck('database', databaseCheck.reason),
        externalServices: externalServicesCheck.status === 'fulfilled' ? externalServicesCheck.value : [this.createFailedCheck('external_services', externalServicesCheck.reason)],
        system: systemCheck.status === 'fulfilled' ? systemCheck.value : this.createFailedSystemCheck(systemCheck.reason),
        business: businessCheck.status === 'fulfilled' ? businessCheck.value : this.createFailedBusinessCheck(businessCheck.reason),
      };

      // Determine overall status
      const overallStatus = this.determineOverallStatus(checks);

      const healthCheck: HealthCheck = {
        status: overallStatus,
        timestamp,
        version: this.version,
        uptime,
        checks,
      };

      // Log health check result
      this.logger.logHealth(overallStatus, healthCheck);
      
      // Update metrics
      this.metrics.updateSystemHealth('overall', this.getHealthScore(overallStatus));

      return healthCheck;
    } catch (error) {
      this.logger.error('Health check failed', error.stack, { error: error.message });
      
      return {
        status: 'unhealthy',
        timestamp,
        version: this.version,
        uptime,
        checks: {
          database: this.createFailedCheck('database', error.message),
          externalServices: [this.createFailedCheck('external_services', error.message)],
          system: this.createFailedSystemCheck(error.message),
          business: this.createFailedBusinessCheck(error.message),
        },
      };
    }
  }

  private async checkDatabase(): Promise<ServiceCheck> {
    const startTime = Date.now();
    
    try {
      // Check database connection
      const dbUrl = this.configService.get('POSTGRES_URL');
      if (!dbUrl) {
        throw new Error('Database URL not configured');
      }

      // Simple database connectivity check
      // In a real implementation, you would execute a simple query
      const responseTime = Date.now() - startTime;
      
      this.metrics.recordDatabaseOperation('health_check', 'system', responseTime / 1000, 'success');
      
      return {
        name: 'database',
        status: 'healthy',
        responseTime,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.metrics.recordDatabaseOperation('health_check', 'system', responseTime / 1000, 'error');
      
      return {
        name: 'database',
        status: 'unhealthy',
        responseTime,
        error: error.message,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  private async checkExternalServices(): Promise<ServiceCheck[]> {
    const services = [
      { name: 'ledgerd', url: this.configService.get('LEDGERD_URL', 'http://localhost:3001') },
      { name: 'mintd', url: this.configService.get('MINTD_URL', 'http://localhost:3003') },
      { name: 'treasury', url: this.configService.get('TREASURY_URL', 'http://localhost:3004') },
      { name: 'pqsigner', url: this.configService.get('PQSIGNER_URL', 'http://localhost:3000') },
    ];

    const checks = await Promise.allSettled(
      services.map(service => this.checkService(service.name, service.url))
    );

    return checks.map((check, index) => {
      if (check.status === 'fulfilled') {
        return check.value;
      } else {
        return this.createFailedCheck(services[index].name, check.reason);
      }
    });
  }

  private async checkService(name: string, url: string): Promise<ServiceCheck> {
    const startTime = Date.now();
    
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${url}/health`, { timeout: 5000 })
      );
      
      const responseTime = Date.now() - startTime;
      const status = response.status === 200 ? 'healthy' : 'degraded';
      
      this.metrics.recordExternalServiceCall(name, 'health_check', responseTime / 1000, status);
      
      return {
        name,
        status,
        responseTime,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.metrics.recordExternalServiceCall(name, 'health_check', responseTime / 1000, 'error');
      
      return {
        name,
        status: 'unhealthy',
        responseTime,
        error: error.message,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  private async checkSystem(): Promise<SystemCheck> {
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal + memoryUsage.external;
    const usedMemory = memoryUsage.heapUsed;
    const memoryPercentage = (usedMemory / totalMemory) * 100;

    // CPU usage calculation (simplified)
    const cpuUsage = process.cpuUsage();
    const cpuPercentage = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to percentage

    // Disk usage (simplified - in production, use a proper disk usage library)
    const diskUsage = {
      used: 0, // Would be calculated using a disk usage library
      total: 0,
      percentage: 0,
    };

    const systemCheck: SystemCheck = {
      memory: {
        used: usedMemory,
        total: totalMemory,
        percentage: memoryPercentage,
      },
      cpu: {
        usage: cpuPercentage,
      },
      disk: diskUsage,
    };

    // Update performance metrics
    this.metrics.updatePerformanceIndicator('memory_usage', 'system', memoryPercentage);
    this.metrics.updatePerformanceIndicator('cpu_usage', 'system', cpuPercentage);

    return systemCheck;
  }

  private async checkBusiness(): Promise<BusinessCheck> {
    // In a real implementation, these would be actual database queries
    const businessCheck: BusinessCheck = {
      activeAccounts: 0, // Would query database
      totalTransfers: 0, // Would query database
      systemLoad: 0, // Would calculate from metrics
      errorRate: 0, // Would calculate from error metrics
    };

    return businessCheck;
  }

  private determineOverallStatus(checks: any): 'healthy' | 'unhealthy' | 'degraded' {
    const databaseHealthy = checks.database.status === 'healthy';
    const externalServicesHealthy = checks.externalServices.every((service: ServiceCheck) => service.status === 'healthy');
    const systemHealthy = checks.system.memory.percentage < 90 && checks.system.cpu.usage < 90;
    const businessHealthy = checks.business.errorRate < 5;

    if (databaseHealthy && externalServicesHealthy && systemHealthy && businessHealthy) {
      return 'healthy';
    } else if (databaseHealthy && systemHealthy) {
      return 'degraded';
    } else {
      return 'unhealthy';
    }
  }

  private getHealthScore(status: string): number {
    switch (status) {
      case 'healthy': return 100;
      case 'degraded': return 50;
      case 'unhealthy': return 0;
      default: return 0;
    }
  }

  private createFailedCheck(name: string, error: string): ServiceCheck {
    return {
      name,
      status: 'unhealthy',
      error,
      lastChecked: new Date().toISOString(),
    };
  }

  private createFailedSystemCheck(error: string): SystemCheck {
    return {
      memory: { used: 0, total: 0, percentage: 0 },
      cpu: { usage: 0 },
      disk: { used: 0, total: 0, percentage: 0 },
    };
  }

  private createFailedBusinessCheck(error: string): BusinessCheck {
    return {
      activeAccounts: 0,
      totalTransfers: 0,
      systemLoad: 0,
      errorRate: 100,
    };
  }
}