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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const monitoring_service_1 = require("./monitoring.service");
let MonitoringController = class MonitoringController {
    constructor(monitoringService) {
        this.monitoringService = monitoringService;
    }
    async getDashboard() {
        return await this.monitoringService.getDashboard();
    }
    getRealTimeMetrics() {
        return this.monitoringService.getRealTimeMetrics();
    }
    getHistoricalMetrics(timeRange) {
        return this.monitoringService.getHistoricalMetrics(timeRange);
    }
    getAlerts() {
        return this.monitoringService.getAlerts();
    }
};
exports.MonitoringController = MonitoringController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get monitoring dashboard',
        description: 'Retrieve comprehensive monitoring dashboard with system, business, and performance metrics'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Monitoring dashboard retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                overview: { type: 'object' },
                system: { type: 'object' },
                business: { type: 'object' },
                errors: { type: 'object' },
                performance: { type: 'object' },
                security: { type: 'object' },
                services: { type: 'array' }
            }
        }
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MonitoringController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('realtime'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get real-time metrics',
        description: 'Retrieve real-time system and performance metrics'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Real-time metrics retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                timestamp: { type: 'string' },
                system: { type: 'object' },
                performance: { type: 'object' },
                security: { type: 'object' }
            }
        }
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MonitoringController.prototype, "getRealTimeMetrics", null);
__decorate([
    (0, common_1.Get)('historical'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get historical metrics',
        description: 'Retrieve historical metrics for the specified time range'
    }),
    (0, swagger_1.ApiQuery)({ name: 'timeRange', required: false, type: String, description: 'Time range for historical data (e.g., 1h, 24h, 7d)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Historical metrics retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                timeRange: { type: 'string' },
                data: { type: 'array' },
                message: { type: 'string' }
            }
        }
    }),
    __param(0, (0, common_1.Query)('timeRange')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MonitoringController.prototype, "getHistoricalMetrics", null);
__decorate([
    (0, common_1.Get)('alerts'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get alerts and notifications',
        description: 'Retrieve current alerts and notifications based on system conditions'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Alerts retrieved successfully',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    type: { type: 'string' },
                    severity: { type: 'string' },
                    message: { type: 'string' },
                    count: { type: 'number' },
                    percentage: { type: 'number' },
                    usage: { type: 'number' }
                }
            }
        }
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MonitoringController.prototype, "getAlerts", null);
exports.MonitoringController = MonitoringController = __decorate([
    (0, swagger_1.ApiTags)('Monitoring'),
    (0, common_1.Controller)('monitoring'),
    __metadata("design:paramtypes", [monitoring_service_1.MonitoringService])
], MonitoringController);
//# sourceMappingURL=monitoring.controller.js.map