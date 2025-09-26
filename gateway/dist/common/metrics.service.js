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
exports.MetricsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const logger_service_1 = require("./logger.service");
const promClient = require('prom-client');
let MetricsService = class MetricsService {
    constructor(configService, logger) {
        this.configService = configService;
        this.logger = logger;
        this.register = new promClient.Registry();
        promClient.collectDefaultMetrics({ register: this.register });
        this.httpRequestDuration = new promClient.Histogram({
            name: 'http_request_duration_seconds',
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
            registers: [this.register],
        });
        this.httpRequestTotal = new promClient.Counter({
            name: 'http_requests_total',
            help: 'Total number of HTTP requests',
            labelNames: ['method', 'route', 'status_code'],
            registers: [this.register],
        });
        this.activeConnections = new promClient.Gauge({
            name: 'active_connections',
            help: 'Number of active connections',
            registers: [this.register],
        });
        this.transferAmount = new promClient.Histogram({
            name: 'transfer_amount_micro_aim',
            help: 'Amount of AIM transferred',
            labelNames: ['from_kind', 'to_kind'],
            buckets: [1000, 10000, 100000, 1000000, 10000000, 100000000],
            registers: [this.register],
        });
        this.transferCount = new promClient.Counter({
            name: 'transfers_total',
            help: 'Total number of transfers',
            labelNames: ['from_kind', 'to_kind', 'status'],
            registers: [this.register],
        });
        this.errorCount = new promClient.Counter({
            name: 'errors_total',
            help: 'Total number of errors',
            labelNames: ['service', 'error_type'],
            registers: [this.register],
        });
        this.databaseOperations = new promClient.Histogram({
            name: 'database_operations_duration_seconds',
            help: 'Duration of database operations in seconds',
            labelNames: ['operation', 'table', 'status'],
            buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
            registers: [this.register],
        });
        this.externalServiceCalls = new promClient.Histogram({
            name: 'external_service_calls_duration_seconds',
            help: 'Duration of external service calls in seconds',
            labelNames: ['service', 'operation', 'status'],
            buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
            registers: [this.register],
        });
        this.businessMetrics = new promClient.Counter({
            name: 'business_events_total',
            help: 'Total number of business events',
            labelNames: ['event_type', 'account_kind', 'status'],
            registers: [this.register],
        });
        this.systemMetrics = new promClient.Gauge({
            name: 'system_health_score',
            help: 'System health score (0-100)',
            labelNames: ['component'],
            registers: [this.register],
        });
        this.securityEvents = new promClient.Counter({
            name: 'security_events_total',
            help: 'Total number of security events',
            labelNames: ['event_type', 'severity', 'source'],
            registers: [this.register],
        });
        this.performanceMetrics = new promClient.Gauge({
            name: 'performance_indicators',
            help: 'Performance indicators',
            labelNames: ['indicator', 'component'],
            registers: [this.register],
        });
    }
    recordHttpRequest(method, route, statusCode, duration) {
        this.httpRequestDuration
            .labels(method, route, statusCode.toString())
            .observe(duration);
        this.httpRequestTotal
            .labels(method, route, statusCode.toString())
            .inc();
    }
    incrementActiveConnections() {
        this.activeConnections.inc();
    }
    decrementActiveConnections() {
        this.activeConnections.dec();
    }
    recordTransfer(fromKind, toKind, amount, status) {
        this.transferAmount
            .labels(fromKind, toKind)
            .observe(amount);
        this.transferCount
            .labels(fromKind, toKind, status)
            .inc();
    }
    recordError(service, errorType) {
        this.errorCount
            .labels(service, errorType)
            .inc();
    }
    async getMetrics() {
        return this.register.metrics();
    }
    recordDatabaseOperation(operation, table, duration, status) {
        this.databaseOperations
            .labels(operation, table, status)
            .observe(duration);
        this.logger.logDatabase(operation, table, duration, { status });
    }
    recordExternalServiceCall(service, operation, duration, status) {
        this.externalServiceCalls
            .labels(service, operation, status)
            .observe(duration);
        this.logger.logExternalService(service, operation, duration, status);
    }
    recordBusinessEvent(eventType, accountKind, status) {
        this.businessMetrics
            .labels(eventType, accountKind, status)
            .inc();
        this.logger.logBusinessEvent(eventType, { accountKind, status });
    }
    updateSystemHealth(component, score) {
        this.systemMetrics
            .labels(component)
            .set(score);
        this.logger.logHealth('system_health', { component, score });
    }
    recordSecurityEvent(eventType, severity, source) {
        this.securityEvents
            .labels(eventType, severity, source)
            .inc();
        this.logger.logSecurity(eventType, { severity, source });
    }
    updatePerformanceIndicator(indicator, component, value) {
        this.performanceMetrics
            .labels(indicator, component)
            .set(value);
        this.logger.logPerformance(indicator, value, { component });
    }
    getHealthMetrics() {
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        return {
            uptime: process.uptime(),
            memory: {
                rss: memoryUsage.rss,
                heapTotal: memoryUsage.heapTotal,
                heapUsed: memoryUsage.heapUsed,
                external: memoryUsage.external,
                arrayBuffers: memoryUsage.arrayBuffers,
            },
            cpu: {
                user: cpuUsage.user,
                system: cpuUsage.system,
            },
            timestamp: new Date().toISOString(),
            version: process.version,
            platform: process.platform,
            arch: process.arch,
        };
    }
    async getAllMetrics() {
        return this.register.metrics();
    }
    getMetricsSummary() {
        return {
            httpRequests: this.httpRequestTotal,
            activeConnections: this.activeConnections,
            transfers: this.transferCount,
            errors: this.errorCount,
            businessEvents: this.businessMetrics,
            securityEvents: this.securityEvents,
            systemHealth: this.systemMetrics,
            performance: this.performanceMetrics,
        };
    }
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        logger_service_1.LoggerService])
], MetricsService);
//# sourceMappingURL=metrics.service.js.map