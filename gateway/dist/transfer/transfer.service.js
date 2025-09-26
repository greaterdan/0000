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
exports.TransferService = exports.TransferRequest = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class TransferRequest {
}
exports.TransferRequest = TransferRequest;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Recipient account ID (UUID)',
        example: '123e4567-e89b-12d3-a456-426614174000',
        format: 'uuid'
    }),
    (0, class_validator_1.IsUUID)(4, { message: 'Recipient must be a valid UUID' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Recipient is required' }),
    __metadata("design:type", String)
], TransferRequest.prototype, "to", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Amount to transfer in microAIM (1 AIM = 1,000,000 microAIM)',
        example: '1000000',
        pattern: '^\\d+$'
    }),
    (0, class_validator_1.IsString)({ message: 'Amount must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Amount is required' }),
    (0, class_validator_1.Matches)(/^\d+$/, { message: 'Amount must be a positive integer' }),
    __metadata("design:type", String)
], TransferRequest.prototype, "microAmount", void 0);
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
], TransferRequest.prototype, "memo", void 0);
let TransferService = class TransferService {
    constructor(httpService) {
        this.httpService = httpService;
    }
    async transfer(request, fromAccountId) {
        const amount = BigInt(request.microAmount);
        if (amount <= 0n) {
            throw new common_1.BadRequestException('Transfer amount must be positive');
        }
        if (amount > 1000000000000n) {
            throw new common_1.BadRequestException('Transfer amount exceeds maximum limit');
        }
        if (request.to === fromAccountId) {
            throw new common_1.BadRequestException('Cannot transfer to yourself');
        }
        const ledgerdUrl = process.env.LEDGERD_URL || 'http://localhost:3001';
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${ledgerdUrl}/internal/transfer`, {
                from: fromAccountId,
                to: request.to,
                microAmount: request.microAmount,
                memo: request.memo,
            }));
            return response.data;
        }
        catch (error) {
            if (error.response?.status === 400) {
                throw new common_1.BadRequestException(error.response.data.message || 'Transfer failed');
            }
            throw error;
        }
    }
    async getTransferHistory(accountId, query) {
        const ledgerdUrl = process.env.LEDGERD_URL || 'http://localhost:3001';
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${ledgerdUrl}/internal/transfers/${accountId}`, {
                params: query
            }));
            return response.data;
        }
        catch (error) {
            if (error.response?.status === 404) {
                return {
                    transfers: [],
                    pagination: {
                        page: query.page || 1,
                        limit: query.limit || 20,
                        total: 0,
                        totalPages: 0
                    }
                };
            }
            throw error;
        }
    }
    async getTransferStats(accountId) {
        const ledgerdUrl = process.env.LEDGERD_URL || 'http://localhost:3001';
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${ledgerdUrl}/internal/transfers/${accountId}/stats`));
            return response.data;
        }
        catch (error) {
            if (error.response?.status === 404) {
                return {
                    totalTransfers: 0,
                    totalVolume: '0',
                    totalFees: '0',
                    averageAmount: '0',
                    successRate: 0,
                    transfersByStatus: {},
                    transfersByType: {}
                };
            }
            throw error;
        }
    }
    async getTransfer(transactionId, accountId) {
        const ledgerdUrl = process.env.LEDGERD_URL || 'http://localhost:3001';
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${ledgerdUrl}/internal/transfers/${transactionId}`, {
                params: { accountId }
            }));
            return response.data;
        }
        catch (error) {
            if (error.response?.status === 404) {
                throw new common_1.BadRequestException('Transfer not found');
            }
            throw error;
        }
    }
};
exports.TransferService = TransferService;
exports.TransferService = TransferService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], TransferService);
//# sourceMappingURL=transfer.service.js.map