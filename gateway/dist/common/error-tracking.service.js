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
exports.ErrorTrackingService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const logger_service_1 = require("./logger.service");
const metrics_service_1 = require("./metrics.service");
let ErrorTrackingService = class ErrorTrackingService {
    constructor(configService, logger, metrics) {
        this.configService = configService;
        this.logger = logger;
        this.metrics = metrics;
        this.serviceName = 'gateway';
        this.version = '1.0.0';
        this.errorReports = new Map();
        this.maxReports = 1000;
    }
    trackError(error, context = {}, severity = 'medium') {
        const errorId = this.generateErrorId();
        const timestamp = new Date().toISOString();
        const environment = this.configService.get('NODE_ENV', 'development');
        const errorReport = {
            id: errorId,
            timestamp,
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
                code: error.code,
            },
            context,
            severity,
            service: this.serviceName,
            environment,
            version: this.version,
            resolved: false,
            tags: this.generateTags(error, context),
        };
        this.storeErrorReport(errorReport);
        this.logger.logError(error, context);
        this.metrics.recordError(severity, error.name);
        this.metrics.recordSecurityEvent('error_occurred', severity, this.serviceName);
        this.sendToExternalService(errorReport);
        return errorId;
    }
    trackValidationError(error, context) {
        return this.trackError(error, context, 'low');
    }
    trackAuthenticationError(error, context) {
        return this.trackError(error, context, 'high');
    }
    trackAuthorizationError(error, context) {
        return this.trackError(error, context, 'high');
    }
    trackDatabaseError(error, context) {
        return this.trackError(error, context, 'critical');
    }
    trackExternalServiceError(error, context) {
        return this.trackError(error, context, 'medium');
    }
    trackBusinessLogicError(error, context) {
        return this.trackError(error, context, 'medium');
    }
    trackSecurityError(error, context) {
        return this.trackError(error, context, 'critical');
    }
    getErrorReports(limit = 50) {
        const reports = Array.from(this.errorReports.values())
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, limit);
        return reports;
    }
    getErrorReport(errorId) {
        return this.errorReports.get(errorId);
    }
    getErrorsBySeverity(severity) {
        return Array.from(this.errorReports.values())
            .filter(report => report.severity === severity)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    getErrorsByService(service) {
        return Array.from(this.errorReports.values())
            .filter(report => report.service === service)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    getErrorStatistics() {
        const reports = Array.from(this.errorReports.values());
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last24HoursErrors = reports.filter(r => new Date(r.timestamp) > last24Hours);
        const last7DaysErrors = reports.filter(r => new Date(r.timestamp) > last7Days);
        const severityCounts = reports.reduce((acc, report) => {
            acc[report.severity] = (acc[report.severity] || 0) + 1;
            return acc;
        }, {});
        const serviceCounts = reports.reduce((acc, report) => {
            acc[report.service] = (acc[report.service] || 0) + 1;
            return acc;
        }, {});
        const errorTypeCounts = reports.reduce((acc, report) => {
            const errorType = report.error.name;
            acc[errorType] = (acc[errorType] || 0) + 1;
            return acc;
        }, {});
        return {
            total: reports.length,
            last24Hours: last24HoursErrors.length,
            last7Days: last7DaysErrors.length,
            severityCounts,
            serviceCounts,
            errorTypeCounts,
            resolved: reports.filter(r => r.resolved).length,
            unresolved: reports.filter(r => !r.resolved).length,
        };
    }
    resolveError(errorId) {
        const report = this.errorReports.get(errorId);
        if (report) {
            report.resolved = true;
            this.logger.log('Error resolved', { errorId, error: report.error.name });
            return true;
        }
        return false;
    }
    clearOldReports(olderThanDays = 30) {
        const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
        let clearedCount = 0;
        for (const [id, report] of this.errorReports.entries()) {
            if (new Date(report.timestamp) < cutoffDate) {
                this.errorReports.delete(id);
                clearedCount++;
            }
        }
        this.logger.log('Cleared old error reports', { clearedCount, olderThanDays });
        return clearedCount;
    }
    generateErrorId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateTags(error, context) {
        const tags = [error.name, this.serviceName];
        if (context.endpoint) {
            tags.push(`endpoint:${context.endpoint}`);
        }
        if (context.method) {
            tags.push(`method:${context.method}`);
        }
        if (context.userId) {
            tags.push('user_error');
        }
        if (context.transactionId) {
            tags.push('transaction_error');
        }
        return tags;
    }
    storeErrorReport(report) {
        this.errorReports.set(report.id, report);
        if (this.errorReports.size > this.maxReports) {
            const oldestReport = Array.from(this.errorReports.values())
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())[0];
            this.errorReports.delete(oldestReport.id);
        }
    }
    async sendToExternalService(report) {
        const externalServiceUrl = this.configService.get('ERROR_TRACKING_URL');
        if (externalServiceUrl) {
            try {
                this.logger.debug('Sending error to external service', {
                    errorId: report.id,
                    service: externalServiceUrl
                });
            }
            catch (error) {
                this.logger.error('Failed to send error to external service', error.stack);
            }
        }
    }
};
exports.ErrorTrackingService = ErrorTrackingService;
exports.ErrorTrackingService = ErrorTrackingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        logger_service_1.LoggerService,
        metrics_service_1.MetricsService])
], ErrorTrackingService);
//# sourceMappingURL=error-tracking.service.js.map