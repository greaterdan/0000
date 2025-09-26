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
exports.ErrorTrackingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const error_tracking_service_1 = require("../common/error-tracking.service");
let ErrorTrackingController = class ErrorTrackingController {
    constructor(errorTrackingService) {
        this.errorTrackingService = errorTrackingService;
    }
    getErrorReports(limit) {
        return this.errorTrackingService.getErrorReports(limit);
    }
    getErrorReport(id) {
        return this.errorTrackingService.getErrorReport(id);
    }
    getErrorStatistics() {
        return this.errorTrackingService.getErrorStatistics();
    }
    getErrorsBySeverity(severity) {
        return this.errorTrackingService.getErrorsBySeverity(severity);
    }
    getErrorsByService(service) {
        return this.errorTrackingService.getErrorsByService(service);
    }
    resolveError(id) {
        const success = this.errorTrackingService.resolveError(id);
        return {
            success,
            message: success ? 'Error marked as resolved' : 'Error not found'
        };
    }
    cleanupOldReports() {
        const clearedCount = this.errorTrackingService.clearOldReports();
        return {
            clearedCount,
            message: `Cleared ${clearedCount} old error reports`
        };
    }
};
exports.ErrorTrackingController = ErrorTrackingController;
__decorate([
    (0, common_1.Get)('reports'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get error reports',
        description: 'Retrieve error reports with optional filtering'
    }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: 'Maximum number of reports to return' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Error reports retrieved successfully',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    timestamp: { type: 'string' },
                    error: { type: 'object' },
                    context: { type: 'object' },
                    severity: { type: 'string' },
                    service: { type: 'string' },
                    resolved: { type: 'boolean' }
                }
            }
        }
    }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ErrorTrackingController.prototype, "getErrorReports", null);
__decorate([
    (0, common_1.Get)('reports/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get specific error report' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Error report ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Error report retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                timestamp: { type: 'string' },
                error: { type: 'object' },
                context: { type: 'object' },
                severity: { type: 'string' },
                service: { type: 'string' },
                resolved: { type: 'boolean' }
            }
        }
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ErrorTrackingController.prototype, "getErrorReport", null);
__decorate([
    (0, common_1.Get)('statistics'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get error statistics',
        description: 'Retrieve error statistics and metrics'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Error statistics retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                total: { type: 'number' },
                last24Hours: { type: 'number' },
                last7Days: { type: 'number' },
                severityCounts: { type: 'object' },
                serviceCounts: { type: 'object' },
                errorTypeCounts: { type: 'object' },
                resolved: { type: 'number' },
                unresolved: { type: 'number' }
            }
        }
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ErrorTrackingController.prototype, "getErrorStatistics", null);
__decorate([
    (0, common_1.Get)('reports/severity/:severity'),
    (0, swagger_1.ApiOperation)({ summary: 'Get error reports by severity' }),
    (0, swagger_1.ApiParam)({ name: 'severity', description: 'Error severity level', enum: ['low', 'medium', 'high', 'critical'] }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Error reports retrieved successfully',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    timestamp: { type: 'string' },
                    error: { type: 'object' },
                    severity: { type: 'string' }
                }
            }
        }
    }),
    __param(0, (0, common_1.Param)('severity')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ErrorTrackingController.prototype, "getErrorsBySeverity", null);
__decorate([
    (0, common_1.Get)('reports/service/:service'),
    (0, swagger_1.ApiOperation)({ summary: 'Get error reports by service' }),
    (0, swagger_1.ApiParam)({ name: 'service', description: 'Service name' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Error reports retrieved successfully',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    timestamp: { type: 'string' },
                    error: { type: 'object' },
                    service: { type: 'string' }
                }
            }
        }
    }),
    __param(0, (0, common_1.Param)('service')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ErrorTrackingController.prototype, "getErrorsByService", null);
__decorate([
    (0, common_1.Post)('reports/:id/resolve'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark error as resolved' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Error report ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Error marked as resolved',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
                message: { type: 'string' }
            }
        }
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ErrorTrackingController.prototype, "resolveError", null);
__decorate([
    (0, common_1.Post)('cleanup'),
    (0, swagger_1.ApiOperation)({ summary: 'Clean up old error reports' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Old error reports cleaned up',
        schema: {
            type: 'object',
            properties: {
                clearedCount: { type: 'number' },
                message: { type: 'string' }
            }
        }
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ErrorTrackingController.prototype, "cleanupOldReports", null);
exports.ErrorTrackingController = ErrorTrackingController = __decorate([
    (0, swagger_1.ApiTags)('Error Tracking'),
    (0, common_1.Controller)('error-tracking'),
    __metadata("design:paramtypes", [error_tracking_service_1.ErrorTrackingService])
], ErrorTrackingController);
//# sourceMappingURL=error-tracking.controller.js.map