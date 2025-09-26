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
exports.TransferController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const transfer_service_1 = require("./transfer.service");
const service_token_guard_1 = require("../auth/service-token.guard");
const transfer_dto_1 = require("./dto/transfer.dto");
let TransferController = class TransferController {
    constructor(transferService) {
        this.transferService = transferService;
    }
    async transfer(request, req) {
        const fromAccountId = req.user.account_id;
        return await this.transferService.transfer(request, fromAccountId);
    }
    async getTransferHistory(query, req) {
        const accountId = req.user.account_id;
        return await this.transferService.getTransferHistory(accountId, query);
    }
    async getTransferStats(req) {
        const accountId = req.user.account_id;
        return await this.transferService.getTransferStats(accountId);
    }
    async getTransfer(transactionId, req) {
        const accountId = req.user.account_id;
        return await this.transferService.getTransfer(transactionId, accountId);
    }
};
exports.TransferController = TransferController;
__decorate([
    (0, common_1.Post)(),
    (0, service_token_guard_1.RequireScopes)(['spend']),
    (0, swagger_1.ApiOperation)({
        summary: 'Transfer AIM tokens',
        description: 'Transfer AIM tokens from the authenticated account to another account'
    }),
    (0, swagger_1.ApiBody)({ type: transfer_dto_1.TransferRequestDto }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Transfer completed successfully',
        type: transfer_dto_1.TransferResponseDto
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - invalid transfer parameters' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - invalid or missing token' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - insufficient permissions or balance' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [transfer_dto_1.TransferRequestDto, Object]),
    __metadata("design:returntype", Promise)
], TransferController.prototype, "transfer", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, service_token_guard_1.RequireScopes)(['view']),
    (0, swagger_1.ApiOperation)({
        summary: 'Get transfer history',
        description: 'Get transfer history for the authenticated account with optional filtering'
    }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, description: 'Page number (1-based)' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: 'Number of items per page' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'] }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, enum: ['standard', 'priority', 'bulk'] }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, type: String, description: 'Filter by date range start' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, type: String, description: 'Filter by date range end' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Transfer history retrieved successfully',
        type: transfer_dto_1.TransferHistoryResponseDto
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - invalid or missing token' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - insufficient permissions' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [transfer_dto_1.TransferHistoryRequestDto, Object]),
    __metadata("design:returntype", Promise)
], TransferController.prototype, "getTransferHistory", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, service_token_guard_1.RequireScopes)(['view']),
    (0, swagger_1.ApiOperation)({
        summary: 'Get transfer statistics',
        description: 'Get transfer statistics for the authenticated account'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Transfer statistics retrieved successfully',
        type: transfer_dto_1.TransferStatsResponseDto
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - invalid or missing token' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - insufficient permissions' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TransferController.prototype, "getTransferStats", null);
__decorate([
    (0, common_1.Get)(':transactionId'),
    (0, service_token_guard_1.RequireScopes)(['view']),
    (0, swagger_1.ApiOperation)({
        summary: 'Get transfer details',
        description: 'Get detailed information about a specific transfer'
    }),
    (0, swagger_1.ApiParam)({ name: 'transactionId', description: 'Transfer transaction ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Transfer details retrieved successfully',
        type: transfer_dto_1.TransferResponseDto
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - invalid or missing token' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - insufficient permissions' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Transfer not found' }),
    __param(0, (0, common_1.Param)('transactionId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TransferController.prototype, "getTransfer", null);
exports.TransferController = TransferController = __decorate([
    (0, swagger_1.ApiTags)('Transfers'),
    (0, common_1.Controller)('v1/transfer'),
    (0, common_1.UseGuards)(service_token_guard_1.ServiceTokenGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    __metadata("design:paramtypes", [transfer_service_1.TransferService])
], TransferController);
//# sourceMappingURL=transfer.controller.js.map