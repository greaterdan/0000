import { TreasuryService } from './treasury.service';
export interface SaleRequest {
    amountAim: number;
    usdAmount: number;
    paymentMethod: 'crypto' | 'fiat';
    paymentDetails: any;
}
export interface SellRequest {
    accountId: string;
    microAmount: string;
    usdValue: number;
    payoutCrypto: string;
}
export declare class TreasuryController {
    private readonly treasuryService;
    constructor(treasuryService: TreasuryService);
    getRates(): Promise<{
        usdBid: number;
        usdAsk: number;
        treasuryReserves: number;
        totalSupply: number;
        publicSaleAllocation: number;
        lastUpdated: string;
    }>;
    getStatus(): Promise<{
        totalSupply: number;
        publicSaleAllocation: number;
        treasuryReserves: number;
        currentPrice: number;
    }>;
    executeSale(request: SaleRequest): Promise<{
        id: any;
        accountId: string;
        microAmount: string;
        usdValue: number;
        status: string;
        timestamp: string;
        transactionHash: any;
    }>;
    getSupplyInfo(): Promise<{
        totalSupply: number;
        publicSaleAllocation: number;
        treasuryReserves: number;
        currentPrice: number;
        saleStats: {
            totalSold: number;
            totalAllocation: number;
            currentPhase: string;
            currentPrice: number;
        };
    }>;
    getSaleStats(): Promise<{
        totalSold: number;
        totalAllocation: number;
        currentPhase: string;
        currentPrice: number;
    }>;
    getPriceHistory(days?: string): Promise<any>;
    executeSell(request: SellRequest): Promise<{
        id: any;
        accountId: string;
        aimAmount: string;
        usdValue: number;
        payoutCrypto: string;
        status: string;
        timestamp: string;
    }>;
    getSellOrders(accountId?: string): Promise<any[]>;
    getSellOrder(orderId: string): Promise<{
        id: string;
        status: string;
        timestamp: string;
    }>;
}
