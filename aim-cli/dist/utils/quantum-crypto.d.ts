export declare class QuantumCrypto {
    /**
     * Generate REAL quantum-safe key pair using Dilithium3
     */
    static generateQuantumKeyPair(seedPhrase: string): {
        publicKey: Buffer;
        privateKey: Buffer;
    };
    /**
     * Sign data with REAL quantum-safe signature using Dilithium3
     */
    static sign(data: Buffer, privateKey: Buffer): Buffer;
    /**
     * Verify REAL quantum-safe signature using Dilithium3
     */
    static verify(data: Buffer, signature: Buffer, publicKey: Buffer): boolean;
    /**
     * Encrypt data with quantum-safe encryption
     */
    static encrypt(data: string, password: string): {
        encrypted: string;
        iv: string;
        authTag: string;
    };
    /**
     * Decrypt data with quantum-safe encryption
     */
    static decrypt(encrypted: string, password: string, iv: string, authTag: string): string;
    /**
     * Get REAL key sizes for Dilithium3 quantum-safe cryptography
     */
    static getKeySizes(): {
        publicKey: number;
        privateKey: number;
        signature: number;
    };
}
//# sourceMappingURL=quantum-crypto.d.ts.map