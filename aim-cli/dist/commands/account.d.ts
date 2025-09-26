export declare class AccountManager {
    private config;
    private api;
    constructor();
    createAccount(): Promise<void>;
    showAccountInfo(): Promise<void>;
    showReceiveAddress(): Promise<void>;
    private saveEncryptedSeed;
    restoreAccount(): Promise<void>;
    exportWallet(): Promise<void>;
    importWallet(): Promise<void>;
}
//# sourceMappingURL=account.d.ts.map