import * as bip39 from 'bip39';
import * as crypto from 'crypto';
import { QuantumCrypto } from './quantum-crypto';
import { createHash, createHmac } from 'crypto';
import * as secp256k1 from 'secp256k1';

export class SeedManager {
  private static readonly SEED_LENGTH = 256; // 24 words
  
  /**
   * Generate a new 24-word BIP39 seed phrase
   */
  static generateSeedPhrase(): string {
    return bip39.generateMnemonic(this.SEED_LENGTH);
  }
  
  /**
   * Validate a BIP39 seed phrase
   */
  static validateSeedPhrase(mnemonic: string): boolean {
    return bip39.validateMnemonic(mnemonic);
  }
  
  /**
   * Convert seed phrase to seed buffer
   */
  static seedPhraseToSeed(mnemonic: string, passphrase?: string): Buffer {
    return bip39.mnemonicToSeedSync(mnemonic, passphrase);
  }
  
  /**
   * Derive private key from seed using HD wallet derivation
   */
  static derivePrivateKey(seed: Buffer, accountIndex: number = 0): Buffer {
    // Use HMAC-SHA512 for key derivation (similar to BIP32)
    const hmac = createHmac('sha512', seed);
    hmac.update(Buffer.from(`aim-account-${accountIndex}`, 'utf8'));
    const derived = hmac.digest();
    
    // Return first 32 bytes as private key
    return derived.slice(0, 32);
  }
  
  /**
   * Derive public key from private key using secp256k1
   */
  static derivePublicKey(privateKey: Buffer): Buffer {
    return secp256k1.publicKeyCreate(privateKey);
  }
  
  /**
   * Sign a message with the private key
   */
  static signMessage(message: string, privateKey: Buffer): string {
    // Create message hash
    const messageHash = createHash('sha256').update(message).digest();
    
    // Sign with secp256k1
    const signature = secp256k1.ecdsaSign(messageHash, privateKey);
    
    // Return signature as hex string
    return signature.signature.toString('hex');
  }
  
  /**
   * Verify a signature against a message and public key
   */
  static verifySignature(message: string, signature: string, publicKey: Buffer): boolean {
    try {
      // Create message hash
      const messageHash = createHash('sha256').update(message).digest();
      
      // Parse signature
      const sigBuffer = Buffer.from(signature, 'hex');
      
      // Verify signature
      return secp256k1.ecdsaVerify(sigBuffer, messageHash, publicKey);
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Encrypt seed phrase with password
   */
  static encryptSeedPhrase(seedPhrase: string, password: string): { encrypted: string; iv: string; authTag: string } {
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
  static decryptSeedPhrase(encrypted: string, password: string, iv: string, authTag: string): string {
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
  static generateNonce(): number {
    return Date.now() + Math.floor(Math.random() * 1000);
  }
  
  /**
   * Create transaction hash for signing
   */
  static createTransactionHash(transactionData: any): string {
    const message = JSON.stringify(transactionData, Object.keys(transactionData).sort());
    return createHash('sha256').update(message).digest('hex');
  }

  // ===== QUANTUM-SAFE METHODS =====

  /**
   * Generate quantum-safe key pair using Dilithium3
   */
  static deriveQuantumKeyPair(seedPhrase: string): { publicKey: Buffer; privateKey: Buffer } {
    return QuantumCrypto.generateQuantumKeyPair(seedPhrase);
  }

  /**
   * Sign message with quantum-safe signature (Dilithium3)
   */
  static signMessageQuantum(message: string, privateKey: Buffer): Buffer {
    const messageBuffer = Buffer.from(message, 'utf8');
    return QuantumCrypto.sign(messageBuffer, privateKey);
  }

  /**
   * Verify quantum-safe signature (Dilithium3)
   */
  static verifySignatureQuantum(message: string, signature: Buffer, publicKey: Buffer): boolean {
    const messageBuffer = Buffer.from(message, 'utf8');
    return QuantumCrypto.verify(messageBuffer, signature, publicKey);
  }

  /**
   * Encrypt seed phrase with quantum-safe encryption
   */
  static encryptSeedPhraseQuantum(seedPhrase: string, password: string): { encrypted: string; iv: string; authTag: string } {
    return QuantumCrypto.encrypt(seedPhrase, password);
  }

  /**
   * Decrypt seed phrase with quantum-safe encryption
   */
  static decryptSeedPhraseQuantum(encrypted: string, password: string, iv: string, authTag: string): string {
    return QuantumCrypto.decrypt(encrypted, password, iv, authTag);
  }

  /**
   * Get quantum-safe key sizes
   */
  static getQuantumKeySizes() {
    return QuantumCrypto.getKeySizes();
  }
}
