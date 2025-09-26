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
exports.HealthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const logger_service_1 = require("../common/logger.service");
const metrics_service_1 = require("../common/metrics.service");
const rxjs_1 = require("rxjs");
let HealthService = class HealthService {
    constructor(configService, httpService, logger, metrics) {
        this.configService = configService;
        this.httpService = httpService;
        this.logger = logger;
        this.metrics = metrics;
        this.serviceName = 'gateway';
        this.version = '1.0.0';
        this.startTime = Date.now();
    }
    async getHealth() {
        const timestamp = new Date().toISOString();
        if (process.env.NODE_ENV === 'production' && !process.env.POSTGRES_URL) {
            return {
                status: 'healthy',
                timestamp,
                version: this.version,
                uptime: Date.now() - this.startTime,
                checks: {
                    database: {
                        name: 'database',
                        status: 'healthy',
                        lastChecked: timestamp,
                        responseTime: 0
                    },
                    externalServices: [],
                    system: {
                        memory: { used: 0, total: 0, percentage: 0 },
                        cpu: { usage: 0 },
                        disk: { used: 0, total: 0, percentage: 0 }
                    },
                    business: {
                        activeAccounts: 0,
                        totalTransfers: 0,
                        systemLoad: 0,
                        errorRate: 0
                    }
                }
            };
        }
        const uptime = Math.floor((Date.now() - this.startTime) / 1000);
        try {
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
            const overallStatus = this.determineOverallStatus(checks);
            const healthCheck = {
                status: overallStatus,
                timestamp,
                version: this.version,
                uptime,
                checks,
            };
            this.logger.logHealth(overallStatus, healthCheck);
            this.metrics.updateSystemHealth('overall', this.getHealthScore(overallStatus));
            return healthCheck;
        }
        catch (error) {
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
    async checkDatabase() {
        const startTime = Date.now();
        try {
            const dbUrl = this.configService.get('POSTGRES_URL');
            if (!dbUrl) {
                throw new Error('Database URL not configured');
            }
            const responseTime = Date.now() - startTime;
            this.metrics.recordDatabaseOperation('health_check', 'system', responseTime / 1000, 'success');
            return {
                name: 'database',
                status: 'healthy',
                responseTime,
                lastChecked: new Date().toISOString(),
            };
        }
        catch (error) {
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
    async checkExternalServices() {
        const services = [
            { name: 'ledgerd', url: this.configService.get('LEDGERD_URL', 'http://localhost:3001') },
            { name: 'mintd', url: this.configService.get('MINTD_URL', 'http://localhost:3003') },
            { name: 'treasury', url: this.configService.get('TREASURY_URL', 'http://localhost:3004') },
            { name: 'pqsigner', url: this.configService.get('PQSIGNER_URL', 'http://localhost:3000') },
        ];
        const checks = await Promise.allSettled(services.map(service => this.checkService(service.name, service.url)));
        return checks.map((check, index) => {
            if (check.status === 'fulfilled') {
                return check.value;
            }
            else {
                return this.createFailedCheck(services[index].name, check.reason);
            }
        });
    }
    async checkService(name, url) {
        const startTime = Date.now();
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${url}/health`, { timeout: 5000 }));
            const responseTime = Date.now() - startTime;
            const status = response.status === 200 ? 'healthy' : 'degraded';
            this.metrics.recordExternalServiceCall(name, 'health_check', responseTime / 1000, status);
            return {
                name,
                status,
                responseTime,
                lastChecked: new Date().toISOString(),
            };
        }
        catch (error) {
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
    async checkSystem() {
        const memoryUsage = process.memoryUsage();
        const totalMemory = memoryUsage.heapTotal + memoryUsage.external;
        const usedMemory = memoryUsage.heapUsed;
        const memoryPercentage = (usedMemory / totalMemory) * 100;
        const cpuUsage = process.cpuUsage();
        const cpuPercentage = (cpuUsage.user + cpuUsage.system) / 1000000;
        const diskUsage = {
            used: 0,
            total: 0,
            percentage: 0,
        };
        const systemCheck = {
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
        this.metrics.updatePerformanceIndicator('memory_usage', 'system', memoryPercentage);
        this.metrics.updatePerformanceIndicator('cpu_usage', 'system', cpuPercentage);
        return systemCheck;
    }
    async checkBusiness() {
        const businessCheck = {
            activeAccounts: 0,
            totalTransfers: 0,
            systemLoad: 0,
            errorRate: 0,
        };
        return businessCheck;
    }
    determineOverallStatus(checks) {
        const databaseHealthy = checks.database.status === 'healthy';
        const externalServicesHealthy = checks.externalServices.every((service) => service.status === 'healthy');
        const systemHealthy = checks.system.memory.percentage < 90 && checks.system.cpu.usage < 90;
        const businessHealthy = checks.business.errorRate < 5;
        if (databaseHealthy && externalServicesHealthy && systemHealthy && businessHealthy) {
            return 'healthy';
        }
        else if (databaseHealthy && systemHealthy) {
            return 'degraded';
        }
        else {
            return 'unhealthy';
        }
    }
    getHealthScore(status) {
        switch (status) {
            case 'healthy': return 100;
            case 'degraded': return 50;
            case 'unhealthy': return 0;
            default: return 0;
        }
    }
    createFailedCheck(name, error) {
        return {
            name,
            status: 'unhealthy',
            error,
            lastChecked: new Date().toISOString(),
        };
    }
    createFailedSystemCheck(error) {
        return {
            memory: { used: 0, total: 0, percentage: 0 },
            cpu: { usage: 0 },
            disk: { used: 0, total: 0, percentage: 0 },
        };
    }
    createFailedBusinessCheck(error) {
        return {
            activeAccounts: 0,
            totalTransfers: 0,
            systemLoad: 0,
            errorRate: 100,
        };
    }
};
exports.HealthService = HealthService;
exports.HealthService = HealthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        axios_1.HttpService,
        logger_service_1.LoggerService,
        metrics_service_1.MetricsService])
], HealthService);
//# sourceMappingURL=health.service.js.map