export declare class CryptoUtils {
    /**
     * Generate a secure random password for encryption
     */
    static generateSecurePassword(length?: number): string;
    /**
     * Hash a password using PBKDF2
     */
    static hashPassword(password: string, salt?: Buffer): {
        hash: string;
        salt: string;
    };
    /**
     * Verify a password against its hash
     */
    static verifyPassword(password: string, hash: string, salt: string): boolean;
    /**
     * Create a secure backup of wallet data
     */
    static createWalletBackup(seedPhrase: string, publicKey: string, accountId: string): string;
    /**
     * Validate wallet backup
     */
    static validateWalletBackup(backupJson: string): boolean;
    /**
     * Create checksum for data integrity
     */
    private static createChecksum;
    /**
     * Generate QR code data for seed phrase (split into chunks)
     */
    static generateSeedPhraseQR(seedPhrase: string): string[];
    /**
     * Reconstruct seed phrase from QR chunks
     */
    static reconstructSeedPhraseFromQR(chunks: string[]): string | null;
}
//# sourceMappingURL=crypto-utils.d.ts.map