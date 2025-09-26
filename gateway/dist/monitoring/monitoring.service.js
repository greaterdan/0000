"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const logger_service_1 = require("../common/logger.service");
const metrics_service_1 = require("../common/metrics.service");
const error_tracking_service_1 = require("../common/error-tracking.service");
const health_service_1 = require("../health/health.service");
let MonitoringService = class MonitoringService {
    constructor(configService, logger, metrics, errorTracking, health) {
        this.configService = configService;
        this.logger = logger;
        this.metrics = metrics;
        this.errorTracking = errorTracking;
        this.health = health;
        this.serviceName = 'gateway';
        this.version = '1.0.0';
        this.startTime = Date.now();
    }
    async getDashboard() {
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
            const dashboard = {
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
        }
        catch (error) {
            this.logger.error('Failed to generate monitoring dashboard', error.stack);
            throw error;
        }
    }
    getSystemMetrics() {
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
                used: 0,
                total: 0,
                percentage: 0,
            },
        };
    }
    getBusinessMetrics() {
        return {
            activeAccounts: 0,
            totalTransfers: 0,
            systemLoad: 0,
            errorRate: 0,
        };
    }
    getPerformanceMetrics() {
        return {
            averageResponseTime: 0,
            requestsPerSecond: 0,
            successRate: 0,
            throughput: 0,
        };
    }
    getSecurityMetrics() {
        return {
            securityEvents: 0,
            failedAuthentications: 0,
            rateLimitHits: 0,
            suspiciousActivities: 0,
        };
    }
    getServiceStatuses(healthCheck) {
        const services = [
            { name: 'database', status: healthCheck.checks.database.status, responseTime: healthCheck.checks.database.responseTime, lastChecked: healthCheck.checks.database.lastChecked },
            ...healthCheck.checks.externalServices.map((service) => ({
                name: service.name,
                status: service.status,
                responseTime: service.responseTime,
                lastChecked: service.lastChecked,
            })),
        ];
        return services;
    }
    getTopErrors(errorTypeCounts) {
        return Object.entries(errorTypeCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({
            name,
            count,
            lastOccurred: new Date().toISOString(),
        }));
    }
    getRealTimeMetrics() {
        return {
            timestamp: new Date().toISOString(),
            system: this.getSystemMetrics(),
            performance: this.getPerformanceMetrics(),
            security: this.getSecurityMetrics(),
        };
    }
    getHistoricalMetrics(timeRange = '1h') {
        return {
            timeRange,
            data: [],
            message: 'Historical metrics not implemented in this demo',
        };
    }
    getAlerts() {
        const alerts = [];
        const errorStats = this.errorTracking.getErrorStatistics();
        if (errorStats.last24Hours > 100) {
            alerts.push({
                type: 'error_rate',
                severity: 'high',
                message: 'High error rate detected in the last 24 hours',
                count: errorStats.last24Hours,
            });
        }
        const systemMetrics = this.getSystemMetrics();
        if (systemMetrics.memory.percentage > 90) {
            alerts.push({
                type: 'memory_usage',
                severity: 'high',
                message: 'High memory usage detected',
                percentage: systemMetrics.memory.percentage,
            });
        }
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
};
exports.MonitoringService = MonitoringService;
exports.MonitoringService = MonitoringService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        logger_service_1.LoggerService,
        metrics_service_1.MetricsService,
        error_tracking_service_1.ErrorTrackingService,
        health_service_1.HealthService])
], MonitoringService);
//# sourceMappingURL=monitoring.service.js.map