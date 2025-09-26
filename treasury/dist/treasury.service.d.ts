import { HttpService } from '@nestjs/common';
export declare class TreasuryService {
    private readonly httpService;
    constructor(httpService: HttpService);
    private currentPrice;
    private lastPriceUpdate;
    private priceCacheTimeout;
    private fetchRealPrice;
    private updatePriceIfNeeded;
    getRates(): Promise<{
        usdBid: number;
        usdAsk: number;
        treasuryReserves: number;
        totalSupply: number;
        publicSaleAllocation: number;
        lastUpdated: string;
    }>;
    getSupplyInfo(): Promise<{
        totalSupply: number;
        publicSaleAllocation: number;
        treasuryReserves: number;
        currentPrice: number;
    }>;
    getSaleStats(): Promise<{
        totalSold: number;
        totalAllocation: number;
        currentPhase: string;
        currentPrice: number;
    }>;
    getPriceHistory(days?: number): Promise<any>;
    executeSale(accountId: string, microAmount: string, usdValue: number): Promise<{
        id: any;
        accountId: string;
        microAmount: string;
        usdValue: number;
        status: string;
        timestamp: string;
        transactionHash: any;
    }>;
    executeSell(accountId: string, microAmount: string, usdValue: number, payoutCrypto: string): Promise<{
        id: any;
        accountId: string;
        microAmount: string;
        usdValue: number;
        payoutCrypto: string;
        status: string;
        timestamp: string;
        transactionHash: any;
    }>;
    getSellOrders(accountId: string): Promise<any[]>;
    getSellOrder(orderId: string): Promise<{
        id: string;
        status: string;
        timestamp: string;
    }>;
}
