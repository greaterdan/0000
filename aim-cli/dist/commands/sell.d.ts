export declare class SellManager {
    private config;
    private api;
    constructor();
    sellTokens(amount?: string, crypto?: string): Promise<void>;
    listSellOrders(): Promise<void>;
    checkSellOrderStatus(orderId: string): Promise<void>;
}
//# sourceMappingURL=sell.d.ts.map