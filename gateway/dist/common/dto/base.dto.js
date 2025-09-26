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
exports.MetricsDto = exports.HealthCheckDto = exports.ErrorResponseDto = exports.PaginatedResponseDto = exports.PaginationDto = exports.BaseResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class BaseResponseDto {
}
exports.BaseResponseDto = BaseResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Response status',
        example: 'success',
        enum: ['success', 'error', 'warning']
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BaseResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Response message',
        example: 'Operation completed successfully'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BaseResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Response timestamp',
        example: '2024-01-01T00:00:00.000Z'
    }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], BaseResponseDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Request correlation ID',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], BaseResponseDto.prototype, "correlationId", void 0);
class PaginationDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
        this.sortOrder = 'desc';
    }
}
exports.PaginationDto = PaginationDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Page number (1-based)',
        example: 1,
        minimum: 1,
        default: 1
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], PaginationDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Number of items per page',
        example: 20,
        minimum: 1,
        maximum: 100,
        default: 20
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], PaginationDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Sort field',
        example: 'createdAt'
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PaginationDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Sort order',
        example: 'desc',
        enum: ['asc', 'desc'],
        default: 'desc'
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PaginationDto.prototype, "sortOrder", void 0);
class PaginatedResponseDto extends BaseResponseDto {
}
exports.PaginatedResponseDto = PaginatedResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Array of items'
    }),
    __metadata("design:type", Array)
], PaginatedResponseDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Pagination metadata',
        example: {
            page: 1,
            limit: 20,
            total: 100,
            totalPages: 5,
            hasNext: true,
            hasPrev: false
        }
    }),
    __metadata("design:type", Object)
], PaginatedResponseDto.prototype, "pagination", void 0);
class ErrorResponseDto extends BaseResponseDto {
}
exports.ErrorResponseDto = ErrorResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Error code',
        example: 'VALIDATION_ERROR'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ErrorResponseDto.prototype, "errorCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Detailed error information',
        example: {
            field: 'email',
            message: 'Invalid email format'
        }
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], ErrorResponseDto.prototype, "details", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Error stack trace (development only)',
        example: 'Error: Validation failed\n    at ...'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ErrorResponseDto.prototype, "stack", void 0);
class HealthCheckDto {
}
exports.HealthCheckDto = HealthCheckDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Service health status',
        example: 'healthy',
        enum: ['healthy', 'unhealthy', 'degraded']
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], HealthCheckDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Service name',
        example: 'gateway'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], HealthCheckDto.prototype, "service", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Service version',
        example: '1.0.0'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], HealthCheckDto.prototype, "version", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Service uptime in seconds',
        example: 3600
    }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], HealthCheckDto.prototype, "uptime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Health check timestamp',
        example: '2024-01-01T00:00:00.000Z'
    }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], HealthCheckDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Detailed health information',
        example: {
            database: { status: 'healthy', responseTime: 5 },
            redis: { status: 'healthy', responseTime: 2 }
        }
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], HealthCheckDto.prototype, "checks", void 0);
class MetricsDto {
}
exports.MetricsDto = MetricsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Metrics timestamp',
        example: '2024-01-01T00:00:00.000Z'
    }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], MetricsDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'System metrics',
        example: {
            memory: { used: 1024, total: 2048, percentage: 50 },
            cpu: { usage: 25.5 }
        }
    }),
    __metadata("design:type", Object)
], MetricsDto.prototype, "system", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Application metrics',
        example: {
            requests: { total: 1000, errors: 5, successRate: 99.5 },
            responseTime: { average: 150, p95: 300, p99: 500 }
        }
    }),
    __metadata("design:type", Object)
], MetricsDto.prototype, "application", void 0);
//# sourceMappingURL=base.dto.js.map