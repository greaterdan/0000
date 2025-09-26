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
exports.CryptoUtils = void 0;
const crypto = __importStar(require("crypto"));
const seed_manager_1 = require("./seed-manager");
class CryptoUtils {
    /**
     * Generate a secure random password for encryption
     */
    static generateSecurePassword(length = 32) {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return password;
    }
    /**
     * Hash a password using PBKDF2
     */
    static hashPassword(password, salt) {
        const saltBuffer = salt || crypto.randomBytes(32);
        const hash = crypto.pbkdf2Sync(password, saltBuffer, 100000, 64, 'sha512');
        return {
            hash: hash.toString('hex'),
            salt: saltBuffer.toString('hex')
        };
    }
    /**
     * Verify a password against its hash
     */
    static verifyPassword(password, hash, salt) {
        const saltBuffer = Buffer.from(salt, 'hex');
        const testHash = crypto.pbkdf2Sync(password, saltBuffer, 100000, 64, 'sha512');
        return testHash.toString('hex') === hash;
    }
    /**
     * Create a secure backup of wallet data
     */
    static createWalletBackup(seedPhrase, publicKey, accountId) {
        const backupData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            accountId,
            publicKey,
            seedPhrase,
            checksum: this.createChecksum(seedPhrase + publicKey + accountId)
        };
        return JSON.stringify(backupData, null, 2);
    }
    /**
     * Validate wallet backup
     */
    static validateWalletBackup(backupJson) {
        try {
            const backup = JSON.parse(backupJson);
            // Check required fields
            if (!backup.version || !backup.accountId || !backup.publicKey || !backup.seedPhrase) {
                return false;
            }
            // Validate seed phrase
            if (!seed_manager_1.SeedManager.validateSeedPhrase(backup.seedPhrase)) {
                return false;
            }
            // Verify checksum
            const expectedChecksum = this.createChecksum(backup.seedPhrase + backup.publicKey + backup.accountId);
            return backup.checksum === expectedChecksum;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Create checksum for data integrity
     */
    static createChecksum(data) {
        return crypto.createHash('sha256').update(data).digest('hex').substring(0, 8);
    }
    /**
     * Generate QR code data for seed phrase (split into chunks)
     */
    static generateSeedPhraseQR(seedPhrase) {
        const words = seedPhrase.split(' ');
        const chunks = [];
        // Split into chunks of 8 words each
        for (let i = 0; i < words.length; i += 8) {
            const chunk = words.slice(i, i + 8).join(' ');
            chunks.push(`AIM-SEED-${Math.floor(i / 8) + 1}: ${chunk}`);
        }
        return chunks;
    }
    /**
     * Reconstruct seed phrase from QR chunks
     */
    static reconstructSeedPhraseFromQR(chunks) {
        try {
            const words = [];
            for (const chunk of chunks) {
                const match = chunk.match(/^AIM-SEED-\d+: (.+)$/);
                if (match) {
                    const chunkWords = match[1].split(' ');
                    words.push(...chunkWords);
                }
            }
            const seedPhrase = words.join(' ');
            // Validate reconstructed seed phrase
            if (seed_manager_1.SeedManager.validateSeedPhrase(seedPhrase)) {
                return seedPhrase;
            }
            return null;
        }
        catch (error) {
            return null;
        }
    }
}
exports.CryptoUtils = CryptoUtils;
//# sourceMappingURL=crypto-utils.js.map