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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreasuryService = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
let TreasuryService = class TreasuryService {
    constructor(httpService) {
        this.httpService = httpService;
        this.currentPrice = 0.75;
        this.lastPriceUpdate = 0;
        this.priceCacheTimeout = 60000;
    }
    async fetchRealPrice() {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'));
            const btcPrice = response.data.bitcoin.usd;
            return Math.max(0.1, btcPrice * 0.00001);
        }
        catch (error) {
            console.warn('Failed to fetch real price, using fallback:', error.message);
            return this.currentPrice;
        }
    }
    async updatePriceIfNeeded() {
        const now = Date.now();
        if (now - this.lastPriceUpdate > this.priceCacheTimeout) {
            this.currentPrice = await this.fetchRealPrice();
            this.lastPriceUpdate = now;
        }
    }
    async getRates() {
        await this.updatePriceIfNeeded();
        return {
            usdBid: this.currentPrice,
            usdAsk: this.currentPrice + 0.01,
            treasuryReserves: 50000000,
            totalSupply: 100000000,
            publicSaleAllocation: 50000000,
            lastUpdated: new Date().toISOString()
        };
    }
    async getSupplyInfo() {
        return {
            totalSupply: 100000000,
            publicSaleAllocation: 50000000,
            treasuryReserves: 50000000,
            currentPrice: this.currentPrice
        };
    }
    async getSaleStats() {
        return {
            totalSold: 0,
            totalAllocation: 50000000,
            currentPhase: 'phase_1',
            currentPrice: this.currentPrice
        };
    }
    async getPriceHistory(days = 30) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}`));
            const prices = response.data.prices;
            return prices.map(([timestamp, btcPrice]) => ({
                date: new Date(timestamp).toISOString(),
                price: Math.max(0.1, btcPrice * 0.00001)
            }));
        }
        catch (error) {
            console.warn('Failed to fetch price history, using fallback:', error.message);
            return [{
                    date: new Date().toISOString(),
                    price: this.currentPrice
                }];
        }
    }
    async executeSale(accountId, microAmount, usdValue) {
        const amount = BigInt(microAmount);
        const price = parseFloat(process.env.TREASURY_USD_BID || '0.75');
        const expectedUsdValue = Number(amount) / 1000000 * price;
        if (Math.abs(usdValue - expectedUsdValue) > 0.01) {
            throw new Error('USD value does not match expected amount');
        }
        const treasuryAccountId = '00000000-0000-0000-0000-000000000001';
        const ledgerdUrl = process.env.LEDGERD_URL || 'http://localhost:3001';
        try {
            const transferResponse = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${ledgerdUrl}/internal/transfer`, {
                from: treasuryAccountId,
                to: accountId,
                microAmount: microAmount,
                memo: `Token sale for $${usdValue}`
            }));
            console.log(`Real token transfer completed: ${microAmount} microAIM to ${accountId}`);
            return {
                id: transferResponse.data.transactionId,
                accountId,
                microAmount,
                usdValue,
                status: 'completed',
                timestamp: new Date().toISOString(),
                transactionHash: transferResponse.data.transactionId
            };
        }
        catch (error) {
            console.error('Token transfer failed:', error.message);
            throw new Error(`Token transfer failed: ${error.message}`);
        }
    }
    async executeSell(accountId, microAmount, usdValue, payoutCrypto) {
        const treasuryAccountId = '00000000-0000-0000-0000-000000000001';
        const ledgerdUrl = process.env.LEDGERD_URL || 'http://localhost:3001';
        try {
            const transferResponse = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${ledgerdUrl}/internal/transfer`, {
                from: accountId,
                to: treasuryAccountId,
                microAmount: microAmount,
                memo: `Token sell for $${usdValue} - payout: ${payoutCrypto}`
            }));
            console.log(`Real token sell completed: ${microAmount} microAIM from ${accountId} for $${usdValue}`);
            return {
                id: transferResponse.data.transactionId,
                accountId,
                microAmount,
                usdValue,
                payoutCrypto,
                status: 'completed',
                timestamp: new Date().toISOString(),
                transactionHash: transferResponse.data.transactionId
            };
        }
        catch (error) {
            console.error('Token sell failed:', error.message);
            throw new Error(`Token sell failed: ${error.message}`);
        }
    }
    async getSellOrders(accountId) {
        return [];
    }
    async getSellOrder(orderId) {
        return {
            id: orderId,
            status: 'completed',
            timestamp: new Date().toISOString()
        };
    }
};
exports.TreasuryService = TreasuryService;
exports.TreasuryService = TreasuryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof common_1.HttpService !== "undefined" && common_1.HttpService) === "function" ? _a : Object])
], TreasuryService);
//# sourceMappingURL=treasury.service.js.map