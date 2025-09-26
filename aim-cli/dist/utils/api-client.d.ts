export declare class ApiClient {
    private client;
    private config;
    constructor();
    private getBaseUrl;
    private getOnrampUrl;
    createAccount(displayName: string, kind: 'human' | 'agent', publicKey?: string): Promise<any>;
    getAccount(accountId: string): Promise<any>;
    getBalance(accountId: string): Promise<any>;
    transfer(fromAccountId: string, toAccountId: string, microAmount: string, memo?: string): Promise<any>;
    createOnrampIntent(accountId: string, crypto: string, amount: string): Promise<any>;
    listOnrampIntents(accountId: string): Promise<any[]>;
    getOnrampIntent(intentId: string): Promise<any>;
    getTransactionHistory(accountId: string, limit?: number): Promise<any[]>;
    getTreasuryRates(): Promise<any>;
    sellAim(accountId: string, microAmount: string, usdValue: number, payoutCrypto: string): Promise<any>;
    getSellOrders(accountId: string): Promise<any[]>;
    getSellOrder(orderId: string): Promise<any>;
    getAccountByPublicKey(publicKey: string): Promise<any>;
    transferSigned(transferData: any): Promise<any>;
}
//# sourceMappingURL=api-client.d.ts.map