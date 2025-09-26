import * as crypto from 'crypto';
import { SeedManager } from './seed-manager';

export class CryptoUtils {
  /**
   * Generate a secure random password for encryption
   */
  static generateSecurePassword(length: number = 32): string {
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
  static hashPassword(password: string, salt?: Buffer): { hash: string; salt: string } {
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
  static verifyPassword(password: string, hash: string, salt: string): boolean {
    const saltBuffer = Buffer.from(salt, 'hex');
    const testHash = crypto.pbkdf2Sync(password, saltBuffer, 100000, 64, 'sha512');
    
    return testHash.toString('hex') === hash;
  }
  
  /**
   * Create a secure backup of wallet data
   */
  static createWalletBackup(seedPhrase: string, publicKey: string, accountId: string): string {
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
  static validateWalletBackup(backupJson: string): boolean {
    try {
      const backup = JSON.parse(backupJson);
      
      // Check required fields
      if (!backup.version || !backup.accountId || !backup.publicKey || !backup.seedPhrase) {
        return false;
      }
      
      // Validate seed phrase
      if (!SeedManager.validateSeedPhrase(backup.seedPhrase)) {
        return false;
      }
      
      // Verify checksum
      const expectedChecksum = this.createChecksum(
        backup.seedPhrase + backup.publicKey + backup.accountId
      );
      
      return backup.checksum === expectedChecksum;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Create checksum for data integrity
   */
  private static createChecksum(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 8);
  }
  
  /**
   * Generate QR code data for seed phrase (split into chunks)
   */
  static generateSeedPhraseQR(seedPhrase: string): string[] {
    const words = seedPhrase.split(' ');
    const chunks: string[] = [];
    
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
  static reconstructSeedPhraseFromQR(chunks: string[]): string | null {
    try {
      const words: string[] = [];
      
      for (const chunk of chunks) {
        const match = chunk.match(/^AIM-SEED-\d+: (.+)$/);
        if (match) {
          const chunkWords = match[1].split(' ');
          words.push(...chunkWords);
        }
      }
      
      const seedPhrase = words.join(' ');
      
      // Validate reconstructed seed phrase
      if (SeedManager.validateSeedPhrase(seedPhrase)) {
        return seedPhrase;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }
}
