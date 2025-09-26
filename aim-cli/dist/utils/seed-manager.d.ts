export declare class SeedManager {
    private static readonly SEED_LENGTH;
    /**
     * Generate a new 24-word BIP39 seed phrase
     */
    static generateSeedPhrase(): string;
    /**
     * Validate a BIP39 seed phrase
     */
    static validateSeedPhrase(mnemonic: string): boolean;
    /**
     * Convert seed phrase to seed buffer
     */
    static seedPhraseToSeed(mnemonic: string, passphrase?: string): Buffer;
    /**
     * Derive private key from seed using HD wallet derivation
     */
    static derivePrivateKey(seed: Buffer, accountIndex?: number): Buffer;
    /**
     * Derive public key from private key using secp256k1
     */
    static derivePublicKey(privateKey: Buffer): Buffer;
    /**
     * Sign a message with the private key
     */
    static signMessage(message: string, privateKey: Buffer): string;
    /**
     * Verify a signature against a message and public key
     */
    static verifySignature(message: string, signature: string, publicKey: Buffer): boolean;
    /**
     * Encrypt seed phrase with password
     */
    static encryptSeedPhrase(seedPhrase: string, password: string): {
        encrypted: string;
        iv: string;
        authTag: string;
    };
    /**
     * Decrypt seed phrase with password
     */
    static decryptSeedPhrase(encrypted: string, password: string, iv: string, authTag: string): string;
    /**
     * Generate a random nonce for transaction
     */
    static generateNonce(): number;
    /**
     * Create transaction hash for signing
     */
    static createTransactionHash(transactionData: any): string;
    /**
     * Generate quantum-safe key pair using Dilithium3
     */
    static deriveQuantumKeyPair(seedPhrase: string): {
        publicKey: Buffer;
        privateKey: Buffer;
    };
    /**
     * Sign message with quantum-safe signature (Dilithium3)
     */
    static signMessageQuantum(message: string, privateKey: Buffer): Buffer;
    /**
     * Verify quantum-safe signature (Dilithium3)
     */
    static verifySignatureQuantum(message: string, signature: Buffer, publicKey: Buffer): boolean;
    /**
     * Encrypt seed phrase with quantum-safe encryption
     */
    static encryptSeedPhraseQuantum(seedPhrase: string, password: string): {
        encrypted: string;
        iv: string;
        authTag: string;
    };
    /**
     * Decrypt seed phrase with quantum-safe encryption
     */
    static decryptSeedPhraseQuantum(encrypted: string, password: string, iv: string, authTag: string): string;
    /**
     * Get quantum-safe key sizes
     */
    static getQuantumKeySizes(): {
        publicKey: number;
        privateKey: number;
        signature: number;
    };
}
//# sourceMappingURL=seed-manager.d.ts.map