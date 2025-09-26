export declare class OnrampManager {
    private config;
    private api;
    constructor();
    createBuyIntent(crypto?: string, amount?: string): Promise<void>;
    listIntents(): Promise<void>;
    checkIntentStatus(intentId: string): Promise<void>;
}
//# sourceMappingURL=onramp.d.ts.map