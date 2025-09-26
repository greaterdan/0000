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
exports.TreasuryController = void 0;
const common_1 = require("@nestjs/common");
const treasury_service_1 = require("./treasury.service");
let TreasuryController = class TreasuryController {
    constructor(treasuryService) {
        this.treasuryService = treasuryService;
    }
    async getRates() {
        return await this.treasuryService.getRates();
    }
    async getStatus() {
        return await this.treasuryService.getSupplyInfo();
    }
    async executeSale(request) {
        try {
            const result = await this.treasuryService.executeSale('mock-account-id', request.amountAim.toString(), request.usdAmount);
            return result;
        }
        catch (error) {
            throw new common_1.BadRequestException(`Sale failed: ${error.message}`);
        }
    }
    async getSupplyInfo() {
        const status = await this.treasuryService.getSupplyInfo();
        const saleStats = await this.treasuryService.getSaleStats();
        return {
            totalSupply: status.totalSupply,
            publicSaleAllocation: status.publicSaleAllocation,
            treasuryReserves: status.treasuryReserves,
            currentPrice: status.currentPrice,
            saleStats: saleStats
        };
    }
    async getSaleStats() {
        return await this.treasuryService.getSaleStats();
    }
    async getPriceHistory(days) {
        return await this.treasuryService.getPriceHistory(days ? parseInt(days) : 30);
    }
    async executeSell(request) {
        try {
            const result = await this.treasuryService.executeSell(request.accountId, request.microAmount, request.usdValue, request.payoutCrypto);
            return {
                id: result.id,
                accountId: request.accountId,
                aimAmount: request.microAmount,
                usdValue: request.usdValue,
                payoutCrypto: request.payoutCrypto,
                status: result.status,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(`Sell failed: ${error.message}`);
        }
    }
    async getSellOrders(accountId) {
        if (!accountId) {
            throw new common_1.BadRequestException('Account ID is required');
        }
        return await this.treasuryService.getSellOrders(accountId);
    }
    async getSellOrder(orderId) {
        return await this.treasuryService.getSellOrder(orderId);
    }
};
exports.TreasuryController = TreasuryController;
__decorate([
    (0, common_1.Get)('rates'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TreasuryController.prototype, "getRates", null);
__decorate([
    (0, common_1.Get)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TreasuryController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('sale'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TreasuryController.prototype, "executeSale", null);
__decorate([
    (0, common_1.Get)('supply'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TreasuryController.prototype, "getSupplyInfo", null);
__decorate([
    (0, common_1.Get)('sale-stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TreasuryController.prototype, "getSaleStats", null);
__decorate([
    (0, common_1.Get)('price-history'),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TreasuryController.prototype, "getPriceHistory", null);
__decorate([
    (0, common_1.Post)('sell'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TreasuryController.prototype, "executeSell", null);
__decorate([
    (0, common_1.Get)('sell-orders'),
    __param(0, (0, common_1.Query)('accountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TreasuryController.prototype, "getSellOrders", null);
__decorate([
    (0, common_1.Get)('sell-orders/:orderId'),
    __param(0, (0, common_1.Query)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TreasuryController.prototype, "getSellOrder", null);
exports.TreasuryController = TreasuryController = __decorate([
    (0, common_1.Controller)('treasury'),
    __metadata("design:paramtypes", [treasury_service_1.TreasuryService])
], TreasuryController);
//# sourceMappingURL=treasury.controller.js.map