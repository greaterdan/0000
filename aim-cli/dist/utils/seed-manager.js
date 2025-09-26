"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedManager = void 0;
const bip39 = __importStar(require("bip39"));
const crypto = __importStar(require("crypto"));
const quantum_crypto_1 = require("./quantum-crypto");
const crypto_1 = require("crypto");
const secp256k1 = __importStar(require("secp256k1"));
class SeedManager {
    /**
     * Generate a new 24-word BIP39 seed phrase
     */
    static generateSeedPhrase() {
        return bip39.generateMnemonic(this.SEED_LENGTH);
    }
    /**
     * Validate a BIP39 seed phrase
     */
    static validateSeedPhrase(mnemonic) {
        return bip39.validateMnemonic(mnemonic);
    }
    /**
     * Convert seed phrase to seed buffer
     */
    static seedPhraseToSeed(mnemonic, passphrase) {
        return bip39.mnemonicToSeedSync(mnemonic, passphrase);
    }
    /**
     * Derive private key from seed using HD wallet derivation
     */
    static derivePrivateKey(seed, accountIndex = 0) {
        // Use HMAC-SHA512 for key derivation (similar to BIP32)
        const hmac = (0, crypto_1.createHmac)('sha512', seed);
        hmac.update(Buffer.from(`aim-account-${accountIndex}`, 'utf8'));
        const derived = hmac.digest();
        // Return first 32 bytes as private key
        return derived.slice(0, 32);
    }
    /**
     * Derive public key from private key using secp256k1
     */
    static derivePublicKey(privateKey) {
        return secp256k1.publicKeyCreate(privateKey);
    }
    /**
     * Sign a message with the private key
     */
    static signMessage(message, privateKey) {
        // Create message hash
        const messageHash = (0, crypto_1.createHash)('sha256').update(message).digest();
        // Sign with secp256k1
        const signature = secp256k1.ecdsaSign(messageHash, privateKey);
        // Return signature as hex string
        return signature.signature.toString('hex');
    }
    /**
     * Verify a signature against a message and public key
     */
    static verifySignature(message, signature, publicKey) {
        try {
            // Create message hash
            const messageHash = (0, crypto_1.createHash)('sha256').update(message).digest();
            // Parse signature
            const sigBuffer = Buffer.from(signature, 'hex');
            // Verify signature
            return secp256k1.ecdsaVerify(sigBuffer, messageHash, publicKey);
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Encrypt seed phrase with password
     */
    static encryptSeedPhrase(seedPhrase, password) {
        const iv = crypto.randomBytes(16);
        const key = crypto.createHash('sha256').update(password).digest();
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(seedPhrase, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        // Create a simple auth tag using HMAC
        const authTag = crypto.createHmac('sha256', key).update(encrypted).digest('hex');
        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag
        };
    }
    /**
     * Decrypt seed phrase with password
     */
    static decryptSeedPhrase(encrypted, password, iv, authTag) {
        const key = crypto.createHash('sha256').update(password).digest();
        const ivBuffer = Buffer.from(iv, 'hex');
        // Verify auth tag
        const expectedAuthTag = crypto.createHmac('sha256', key).update(encrypted).digest('hex');
        if (expectedAuthTag !== authTag) {
            throw new Error('Invalid password or corrupted data');
        }
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, ivBuffer);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    /**
     * Generate a random nonce for transaction
     */
    static generateNonce() {
        return Date.now() + Math.floor(Math.random() * 1000);
    }
    /**
     * Create transaction hash for signing
     */
    static createTransactionHash(transactionData) {
        const message = JSON.stringify(transactionData, Object.keys(transactionData).sort());
        return (0, crypto_1.createHash)('sha256').update(message).digest('hex');
    }
    // ===== QUANTUM-SAFE METHODS =====
    /**
     * Generate quantum-safe key pair using Dilithium3
     */
    static deriveQuantumKeyPair(seedPhrase) {
        return quantum_crypto_1.QuantumCrypto.generateQuantumKeyPair(seedPhrase);
    }
    /**
     * Sign message with quantum-safe signature (Dilithium3)
     */
    static signMessageQuantum(message, privateKey) {
        const messageBuffer = Buffer.from(message, 'utf8');
        return quantum_crypto_1.QuantumCrypto.sign(messageBuffer, privateKey);
    }
    /**
     * Verify quantum-safe signature (Dilithium3)
     */
    static verifySignatureQuantum(message, signature, publicKey) {
        const messageBuffer = Buffer.from(message, 'utf8');
        return quantum_crypto_1.QuantumCrypto.verify(messageBuffer, signature, publicKey);
    }
    /**
     * Encrypt seed phrase with quantum-safe encryption
     */
    static encryptSeedPhraseQuantum(seedPhrase, password) {
        return quantum_crypto_1.QuantumCrypto.encrypt(seedPhrase, password);
    }
    /**
     * Decrypt seed phrase with quantum-safe encryption
     */
    static decryptSeedPhraseQuantum(encrypted, password, iv, authTag) {
        return quantum_crypto_1.QuantumCrypto.decrypt(encrypted, password, iv, authTag);
    }
    /**
     * Get quantum-safe key sizes
     */
    static getQuantumKeySizes() {
        return quantum_crypto_1.QuantumCrypto.getKeySizes();
    }
}
exports.SeedManager = SeedManager;
SeedManager.SEED_LENGTH = 256; // 24 words
//# sourceMappingURL=seed-manager.js.map