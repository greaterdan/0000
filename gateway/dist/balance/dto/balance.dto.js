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
exports.ReleaseReservationResponseDto = exports.ReleaseReservationRequestDto = exports.ReserveBalanceResponseDto = exports.ReserveBalanceRequestDto = exports.GetBalanceStatsResponseDto = exports.BalanceStatsDto = exports.GetBalanceHistoryResponseDto = exports.GetBalanceHistoryRequestDto = exports.BalanceHistoryDto = exports.GetMultipleBalancesResponseDto = exports.GetMultipleBalancesRequestDto = exports.GetBalanceResponseDto = exports.GetBalanceRequestDto = exports.BalanceDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const base_dto_1 = require("../../common/dto/base.dto");
class BalanceDto {
}
exports.BalanceDto = BalanceDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account ID',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BalanceDto.prototype, "accountId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account balance in microAIM',
        example: '1000000000'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BalanceDto.prototype, "microAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account balance in AIM (human readable)',
        example: '1000.000000'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BalanceDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Balance last updated timestamp',
        example: '2024-01-01T00:00:00.000Z'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BalanceDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account display name',
        example: 'John Doe'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BalanceDto.prototype, "displayName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account type',
        example: 'human',
        enum: ['human', 'agent', 'treasury']
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BalanceDto.prototype, "accountKind", void 0);
class GetBalanceRequestDto {
}
exports.GetBalanceRequestDto = GetBalanceRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account ID to get balance for',
        example: '123e4567-e89b-12d3-a456-426614174000',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(4, { message: 'Account ID must be a valid UUID' }),
    __metadata("design:type", String)
], GetBalanceRequestDto.prototype, "accountId", void 0);
class GetBalanceResponseDto extends base_dto_1.BaseResponseDto {
}
exports.GetBalanceResponseDto = GetBalanceResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account balance information'
    }),
    __metadata("design:type", BalanceDto)
], GetBalanceResponseDto.prototype, "balance", void 0);
class GetMultipleBalancesRequestDto {
}
exports.GetMultipleBalancesRequestDto = GetMultipleBalancesRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Array of account IDs to get balances for',
        example: ['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001'],
        type: [String],
        maxItems: 100
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Account IDs are required' }),
    (0, class_validator_1.IsUUID)(4, { each: true, message: 'Each account ID must be a valid UUID' }),
    __metadata("design:type", Array)
], GetMultipleBalancesRequestDto.prototype, "accountIds", void 0);
class GetMultipleBalancesResponseDto extends base_dto_1.BaseResponseDto {
}
exports.GetMultipleBalancesResponseDto = GetMultipleBalancesResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Array of account balances',
        type: [BalanceDto]
    }),
    __metadata("design:type", Array)
], GetMultipleBalancesResponseDto.prototype, "balances", void 0);
class BalanceHistoryDto {
}
exports.BalanceHistoryDto = BalanceHistoryDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account ID',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BalanceHistoryDto.prototype, "accountId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Balance at this point in time',
        example: '1000000000'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BalanceHistoryDto.prototype, "balance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Balance change amount',
        example: '1000000'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BalanceHistoryDto.prototype, "change", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Change type',
        example: 'credit',
        enum: ['credit', 'debit']
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BalanceHistoryDto.prototype, "changeType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Transaction ID that caused this change',
        example: 'tx_123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BalanceHistoryDto.prototype, "transactionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Change description',
        example: 'Transfer from account 123e4567-e89b-12d3-a456-426614174001'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BalanceHistoryDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Change timestamp',
        example: '2024-01-01T00:00:00.000Z'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BalanceHistoryDto.prototype, "timestamp", void 0);
class GetBalanceHistoryRequestDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
    }
}
exports.GetBalanceHistoryRequestDto = GetBalanceHistoryRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account ID to get history for',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, class_validator_1.IsUUID)(4, { message: 'Account ID must be a valid UUID' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Account ID is required' }),
    __metadata("design:type", String)
], GetBalanceHistoryRequestDto.prototype, "accountId", void 0);
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
], GetBalanceHistoryRequestDto.prototype, "page", void 0);
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
], GetBalanceHistoryRequestDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter by date range start',
        example: '2024-01-01T00:00:00.000Z',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetBalanceHistoryRequestDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter by date range end',
        example: '2024-01-31T23:59:59.999Z',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetBalanceHistoryRequestDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Filter by change type',
        example: 'credit',
        enum: ['credit', 'debit'],
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetBalanceHistoryRequestDto.prototype, "changeType", void 0);
class GetBalanceHistoryResponseDto extends base_dto_1.BaseResponseDto {
}
exports.GetBalanceHistoryResponseDto = GetBalanceHistoryResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Array of balance history entries',
        type: [BalanceHistoryDto]
    }),
    __metadata("design:type", Array)
], GetBalanceHistoryResponseDto.prototype, "history", void 0);
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
], GetBalanceHistoryResponseDto.prototype, "pagination", void 0);
class BalanceStatsDto {
}
exports.BalanceStatsDto = BalanceStatsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Total number of accounts',
        example: 1000
    }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], BalanceStatsDto.prototype, "totalAccounts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Total supply in microAIM',
        example: '1000000000000000'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BalanceStatsDto.prototype, "totalSupply", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Total supply in AIM (human readable)',
        example: '1000000.000000'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BalanceStatsDto.prototype, "totalSupplyFormatted", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Number of accounts with zero balance',
        example: 50
    }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], BalanceStatsDto.prototype, "zeroBalanceAccounts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Average balance in microAIM',
        example: '1000000000'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BalanceStatsDto.prototype, "averageBalance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Average balance in AIM (human readable)',
        example: '1000.000000'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BalanceStatsDto.prototype, "averageBalanceFormatted", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Top 10 accounts by balance',
        type: [BalanceDto]
    }),
    __metadata("design:type", Array)
], BalanceStatsDto.prototype, "topAccounts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Balance distribution by account type',
        example: {
            human: '500000000000000',
            agent: '300000000000000',
            treasury: '200000000000000'
        }
    }),
    __metadata("design:type", Object)
], BalanceStatsDto.prototype, "distributionByType", void 0);
class GetBalanceStatsResponseDto extends base_dto_1.BaseResponseDto {
}
exports.GetBalanceStatsResponseDto = GetBalanceStatsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Balance statistics'
    }),
    __metadata("design:type", BalanceStatsDto)
], GetBalanceStatsResponseDto.prototype, "stats", void 0);
class ReserveBalanceRequestDto {
    constructor() {
        this.expiresIn = 300;
    }
}
exports.ReserveBalanceRequestDto = ReserveBalanceRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account ID to reserve balance for',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, class_validator_1.IsUUID)(4, { message: 'Account ID must be a valid UUID' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Account ID is required' }),
    __metadata("design:type", String)
], ReserveBalanceRequestDto.prototype, "accountId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Amount to reserve in microAIM',
        example: '1000000'
    }),
    (0, class_validator_1.IsString)({ message: 'Amount must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Amount is required' }),
    __metadata("design:type", String)
], ReserveBalanceRequestDto.prototype, "microAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Reservation reason',
        example: 'Pending transfer',
        maxLength: 255
    }),
    (0, class_validator_1.IsString)({ message: 'Reason must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Reason is required' }),
    __metadata("design:type", String)
], ReserveBalanceRequestDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Reservation expiration time in seconds',
        example: 300,
        minimum: 60,
        maximum: 3600
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(60),
    (0, class_validator_1.Max)(3600),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], ReserveBalanceRequestDto.prototype, "expiresIn", void 0);
class ReserveBalanceResponseDto extends base_dto_1.BaseResponseDto {
}
exports.ReserveBalanceResponseDto = ReserveBalanceResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Reservation ID',
        example: 'res_123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReserveBalanceResponseDto.prototype, "reservationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Reserved amount in microAIM',
        example: '1000000'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReserveBalanceResponseDto.prototype, "reservedAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Reservation expiration timestamp',
        example: '2024-01-01T00:05:00.000Z'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReserveBalanceResponseDto.prototype, "expiresAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Remaining available balance in microAIM',
        example: '999000000'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReserveBalanceResponseDto.prototype, "availableBalance", void 0);
class ReleaseReservationRequestDto {
}
exports.ReleaseReservationRequestDto = ReleaseReservationRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Reservation ID to release',
        example: 'res_123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, class_validator_1.IsString)({ message: 'Reservation ID must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Reservation ID is required' }),
    __metadata("design:type", String)
], ReleaseReservationRequestDto.prototype, "reservationId", void 0);
class ReleaseReservationResponseDto extends base_dto_1.BaseResponseDto {
}
exports.ReleaseReservationResponseDto = ReleaseReservationResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Reservation release result',
        example: true
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReleaseReservationResponseDto.prototype, "released", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Released amount in microAIM',
        example: '1000000'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReleaseReservationResponseDto.prototype, "releasedAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'New available balance in microAIM',
        example: '1000000000'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReleaseReservationResponseDto.prototype, "availableBalance", void 0);
//# sourceMappingURL=balance.dto.js.map