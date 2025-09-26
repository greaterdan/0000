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
exports.TransferStatsResponseDto = exports.TransferHistoryResponseDto = exports.TransferStatsDto = exports.TransferHistoryRequestDto = exports.TransferHistoryDto = exports.TransferResponseDto = exports.TransferRequestDto = exports.TransferType = exports.TransferStatus = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const base_dto_1 = require("../../common/dto/base.dto");
var TransferStatus;
(function (TransferStatus) {
    TransferStatus["PENDING"] = "pending";
    TransferStatus["PROCESSING"] = "processing";
    TransferStatus["COMPLETED"] = "completed";
    TransferStatus["FAILED"] = "failed";
    TransferStatus["CANCELLED"] = "cancelled";
})(TransferStatus || (exports.TransferStatus = TransferStatus = {}));
var TransferType;
(function (TransferType) {
    TransferType["STANDARD"] = "standard";
    TransferType["PRIORITY"] = "priority";
    TransferType["BULK"] = "bulk";
})(TransferType || (exports.TransferType = TransferType = {}));
class TransferRequestDto {
    constructor() {
        this.type = TransferType.STANDARD;
    }
}
exports.TransferRequestDto = TransferRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Recipient account ID (UUID)',
        example: '123e4567-e89b-12d3-a456-426614174000',
        format: 'uuid'
    }),
    (0, class_validator_1.IsUUID)(4, { message: 'Recipient must be a valid UUID' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Recipient is required' }),
    __metadata("design:type", String)
], TransferRequestDto.prototype, "to", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Amount to transfer in microAIM (1 AIM = 1,000,000 microAIM)',
        example: '1000000',
        pattern: '^\\d+$',
        minimum: 1,
        maximum: 1000000000000
    }),
    (0, class_validator_1.IsString)({ message: 'Amount must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Amount is required' }),
    (0, class_validator_1.Matches)(/^\d+$/, { message: 'Amount must be a positive integer' }),
    __metadata("design:type", String)
], TransferRequestDto.prototype, "microAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Optional memo for the transfer',
        example: 'Payment for AI service',
        required: false,
        maxLength: 500
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Memo must be a string' }),
    (0, class_validator_1.MinLength)(1, { message: 'Memo cannot be empty' }),
    (0, class_validator_1.MaxLength)(500, { message: 'Memo cannot exceed 500 characters' }),
    __metadata("design:type", String)
], TransferRequestDto.prototype, "memo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Transfer type',
        example: 'standard',
        enum: TransferType,
        default: TransferType.STANDARD
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(TransferType, { message: 'Invalid transfer type' }),
    __metadata("design:type", String)
], TransferRequestDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Optional reference ID for tracking',
        example: 'REF-123456',
        required: false,
        maxLength: 100
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Reference must be a string' }),
    (0, class_validator_1.MaxLength)(100, { message: 'Reference cannot exceed 100 characters' }),
    __metadata("design:type", String)
], TransferRequestDto.prototype, "reference", void 0);
class TransferResponseDto extends base_dto_1.BaseResponseDto {
}
exports.TransferResponseDto = TransferResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Transfer transaction ID',
        example: 'tx_123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransferResponseDto.prototype, "transactionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Transfer status',
        example: 'completed',
        enum: TransferStatus
    }),
    (0, class_validator_1.IsEnum)(TransferStatus),
    __metadata("design:type", String)
], TransferResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Transfer amount in microAIM',
        example: '1000000'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransferResponseDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Sender account ID',
        example: '123e4567-e89b-12d3-a456-426614174001'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransferResponseDto.prototype, "from", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Recipient account ID',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransferResponseDto.prototype, "to", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Transfer memo',
        example: 'Payment for AI service'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransferResponseDto.prototype, "memo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Transfer type',
        example: 'standard',
        enum: TransferType
    }),
    (0, class_validator_1.IsEnum)(TransferType),
    __metadata("design:type", String)
], TransferResponseDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Transfer reference ID',
        example: 'REF-123456'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransferResponseDto.prototype, "reference", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Transfer timestamp',
        example: '2024-01-01T00:00:00.000Z'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransferResponseDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Transaction fee in microAIM',
        example: '1000'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransferResponseDto.prototype, "fee", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Block height (if applicable)',
        example: 12345
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TransferResponseDto.prototype, "blockHeight", void 0);
class TransferHistoryDto {
}
exports.TransferHistoryDto = TransferHistoryDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Transfer transaction ID',
        example: 'tx_123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransferHistoryDto.prototype, "transactionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Transfer status',
        example: 'completed',
        enum: TransferStatus
    }),
    (0, class_validator_1.IsEnum)(TransferStatus),
    __metadata("design:type", String)
], TransferHistoryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Transfer amount in microAIM',
        example: '1000000'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransferHistoryDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Sender account ID',
        example: '123e4567-e89b-12d3-a456-426614174001'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransferHistoryDto.prototype, "from", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Recipient account ID',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransferHistoryDto.prototype, "to", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Transfer memo',
        example: 'Payment for AI service'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransferHistoryDto.prototype, "memo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Transfer type',
        example: 'standard',
        enum: TransferType
    }),
    (0, class_validator_1.IsEnum)(TransferType),
    __metadata("design:type", String)
], TransferHistoryDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Transfer timestamp',
        example: '2024-01-01T00:00:00.000Z'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransferHistoryDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Transaction fee in microAIM',
        example: '1000'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransferHistoryDto.prototype, "fee", void 0);
class TransferHistoryRequestDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
    }
}
exports.TransferHistoryRequestDto = TransferHistoryRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Page number (1-based)',
        example: 1,
        minimum: 1,
        default: 1
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], TransferHistoryRequestDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Number of items per page',
        example: 20,
        minimum: 1,
        maximum: 100,
        default: 20
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], TransferHistoryRequestDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter by transfer status',
        example: 'completed',
        enum: TransferStatus,
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(TransferStatus),
    __metadata("design:type", String)
], TransferHistoryRequestDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter by transfer type',
        example: 'standard',
        enum: TransferType,
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(TransferType),
    __metadata("design:type", String)
], TransferHistoryRequestDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter by date range start',
        example: '2024-01-01T00:00:00.000Z',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransferHistoryRequestDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter by date range end',
        example: '2024-01-31T23:59:59.999Z',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransferHistoryRequestDto.prototype, "endDate", void 0);
class TransferStatsDto {
}
exports.TransferStatsDto = TransferStatsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Total number of transfers',
        example: 1000
    }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TransferStatsDto.prototype, "totalTransfers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Total transfer volume in microAIM',
        example: '1000000000000'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransferStatsDto.prototype, "totalVolume", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Total fees paid in microAIM',
        example: '1000000'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransferStatsDto.prototype, "totalFees", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Average transfer amount in microAIM',
        example: '1000000'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransferStatsDto.prototype, "averageAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Transfer success rate percentage',
        example: 99.5
    }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TransferStatsDto.prototype, "successRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Transfers by status',
        example: {
            completed: 950,
            pending: 30,
            failed: 20
        }
    }),
    __metadata("design:type", Object)
], TransferStatsDto.prototype, "transfersByStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Transfers by type',
        example: {
            standard: 800,
            priority: 150,
            bulk: 50
        }
    }),
    __metadata("design:type", Object)
], TransferStatsDto.prototype, "transfersByType", void 0);
class TransferHistoryResponseDto extends base_dto_1.BaseResponseDto {
}
exports.TransferHistoryResponseDto = TransferHistoryResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'List of transfer history items',
        type: [TransferHistoryDto]
    }),
    __metadata("design:type", Array)
], TransferHistoryResponseDto.prototype, "transfers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Pagination information',
        example: {
            page: 1,
            limit: 20,
            total: 1000,
            totalPages: 50
        }
    }),
    __metadata("design:type", Object)
], TransferHistoryResponseDto.prototype, "pagination", void 0);
class TransferStatsResponseDto extends base_dto_1.BaseResponseDto {
}
exports.TransferStatsResponseDto = TransferStatsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Transfer statistics',
        type: TransferStatsDto
    }),
    __metadata("design:type", TransferStatsDto)
], TransferStatsResponseDto.prototype, "stats", void 0);
//# sourceMappingURL=transfer.dto.js.map