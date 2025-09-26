import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import qrcode from 'qrcode-terminal';
import { ConfigManager } from './config';
import { ApiClient } from '../utils/api-client';
import { SeedManager } from '../utils/seed-manager';
import { CryptoUtils } from '../utils/crypto-utils';

export class AccountManager {
  private config: ConfigManager;
  private api: ApiClient;

  constructor() {
    this.config = new ConfigManager();
    this.api = new ApiClient();
  }

  async createAccount(): Promise<void> {
    console.log(chalk.blue.bold('\nWelcome to AIM Wallet!\n'));
    console.log(chalk.gray('Let\'s create your secure wallet in just a few steps.\n'));

    // Generate seed phrase and quantum-safe key pair
    const seedPhrase = SeedManager.generateSeedPhrase();
    const { publicKey, privateKey } = SeedManager.deriveQuantumKeyPair(seedPhrase);
    
    console.log(chalk.cyan('Generated quantum-safe wallet with Dilithium3 cryptography'));
    
    // Show seed phrase to user
    console.log(chalk.yellow.bold('Step 1: Save Your Recovery Phrase'));
    console.log(chalk.white('Write down these 24 words in order:'));
    console.log(chalk.green.bold(`\n${seedPhrase}\n`));
    console.log(chalk.red('WARNING: Keep this safe! Anyone with these words can access your wallet.\n'));
    
    // Confirm user saved seed phrase
    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: 'I have written down my recovery phrase safely',
        default: false
      }
    ]);
    
    if (!confirmed) {
      console.log(chalk.red('\nPlease write down your recovery phrase first!'));
      console.log(chalk.yellow('Run "aim setup" again when you\'re ready.\n'));
      return;
    }

    console.log(chalk.yellow.bold('\nStep 2: Your Information'));
    
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'displayName',
        message: 'What should we call you?',
        default: 'User',
        validate: (input: string) => {
          if (!input.trim()) {
            return 'Please enter a name';
          }
          return true;
        }
      }
    ]);

    const spinner = ora('Creating account...').start();

    try {
      // Create account with public key
      const response = await this.api.createAccount(
        answers.displayName, 
        'human',
        publicKey.toString('hex')
      );
      
      spinner.succeed('Account created successfully!');
      
      console.log(chalk.yellow.bold('\nStep 3: Secure Your Wallet'));
      
      // Save encrypted seed phrase to config
      await this.saveEncryptedSeed(seedPhrase, privateKey);
      
      // Save account info
      await this.config.setConfig('accountId', response.id);
      await this.config.setConfig('displayName', response.displayName);
      await this.config.setConfig('accountKind', 'human');
      await this.config.setConfig('publicKey', publicKey.toString('hex'));

      console.log(chalk.green.bold('\nWallet Created Successfully!'));
      console.log(chalk.white(`   Name: ${response.displayName}`));
      console.log(chalk.white(`   Wallet ID: ${response.id.substring(0, 8)}...`));
      console.log(chalk.white(`   Status: Active`));
      
      console.log(chalk.blue.bold('\nWhat\'s Next?'));
      console.log(chalk.white('   • Check balance: aim balance'));
      console.log(chalk.white('   • Buy tokens: aim buy'));
      console.log(chalk.white('   • Send tokens: aim send'));
      console.log(chalk.white('   • Export backup: aim backup\n'));
      
      console.log(chalk.gray('Your wallet is secure and ready to use!'));

    } catch (error: any) {
      spinner.fail('Failed to create account');
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  }

  async showAccountInfo(): Promise<void> {
    const accountId = await this.config.getConfig('accountId');
    
    if (!accountId) {
      console.log(chalk.red('No account found. Create one with: aim account --create'));
      return;
    }

    const spinner = ora('Loading account info...').start();

    try {
      const account = await this.api.getAccount(accountId);
      
      spinner.succeed('Account loaded');

      console.log(chalk.blue.bold('\n👤 Account Information\n'));
      console.log(chalk.white(`   ID: ${account.id}`));
      console.log(chalk.white(`   Name: ${account.displayName}`));
      console.log(chalk.white(`   Type: ${account.kind}`));
      console.log(chalk.white(`   Status: ${account.status}`));
      console.log(chalk.white(`   Reputation: ${account.reputationScore}`));
      console.log(chalk.white(`   TPM Attested: ${account.tpmAttested ? 'Yes' : 'No'}`));
      console.log(chalk.white(`   Created: ${new Date(account.createdAt).toLocaleString()}`));

    } catch (error: any) {
      spinner.fail('Failed to load account');
      console.error(chalk.red(`Error: ${error.message}`));
    }
  }

  async showReceiveAddress(): Promise<void> {
    const accountId = await this.config.getConfig('accountId');
    
    if (!accountId) {
      console.log(chalk.red('No account found. Create one with: aim account --create'));
      return;
    }

    console.log(chalk.blue.bold('\n📨 Receive AIM Tokens\n'));
    console.log(chalk.white('Your account address:'));
    console.log(chalk.green.bold(`   ${accountId}\n`));
    
    console.log(chalk.gray('Share this address with others to receive AIM tokens.'));
    console.log(chalk.gray('You can also generate a QR code for easy sharing.\n'));

    const { showQR } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'showQR',
        message: 'Show QR code?',
        default: true
      }
    ]);

    if (showQR) {
      console.log(chalk.blue('\n📱 QR Code:'));
      qrcode.generate(accountId, { small: true });
    }
  }
  
  private async saveEncryptedSeed(seedPhrase: string, privateKey: Buffer): Promise<void> {
    // Prompt for encryption password
    const { password } = await inquirer.prompt([
      {
        type: 'password',
        name: 'password',
        message: 'Create a password to protect your wallet:',
        mask: '*',
        validate: (input: string) => {
          if (!input || input.length < 6) {
            return 'Password must be at least 6 characters long';
          }
          return true;
        }
      }
    ]);
    
    // Encrypt seed phrase with quantum-safe encryption
    const encrypted = SeedManager.encryptSeedPhraseQuantum(seedPhrase, password);
    
    // Save encrypted data
    await this.config.setConfig('encryptedSeed', encrypted.encrypted);
    await this.config.setConfig('seedIV', encrypted.iv);
    await this.config.setConfig('seedAuthTag', encrypted.authTag);
    await this.config.setConfig('hasSeed', 'true');
    await this.config.setConfig('cryptoType', 'quantum-safe');
    
    console.log(chalk.green('Wallet secured with quantum-safe cryptography'));
  }
  
  async restoreAccount(): Promise<void> {
    console.log(chalk.blue.bold('\nRestore AIM Account\n'));
    
    const { seedPhrase } = await inquirer.prompt([
      {
        type: 'input',
        name: 'seedPhrase',
        message: 'Enter your 24-word seed phrase:',
        validate: (input: string) => {
          if (!SeedManager.validateSeedPhrase(input)) {
            return 'Invalid seed phrase format';
          }
          return true;
        }
      }
    ]);
    
    // Derive quantum-safe keys from seed phrase
    const { publicKey, privateKey } = SeedManager.deriveQuantumKeyPair(seedPhrase);
    
    console.log(chalk.cyan('Restoring quantum-safe wallet with Dilithium3 cryptography'));
    
    // Look up account by public key
    const spinner = ora('Looking up account...').start();
    try {
      const account = await this.api.getAccountByPublicKey(publicKey.toString('hex'));
      
      spinner.succeed('Account restored!');
      
      // Save encrypted seed phrase
      await this.saveEncryptedSeed(seedPhrase, privateKey);
      
      // Save account info
      await this.config.setConfig('accountId', account.id);
      await this.config.setConfig('displayName', account.displayName);
      await this.config.setConfig('accountKind', account.kind);
      await this.config.setConfig('publicKey', publicKey.toString('hex'));
      
      console.log(chalk.green('\nAccount Restored:'));
      console.log(chalk.white(`   ID: ${account.id}`));
      console.log(chalk.white(`   Name: ${account.displayName}`));
      console.log(chalk.white(`   Type: ${account.kind}`));
      
    } catch (error: any) {
      spinner.fail('Account not found');
      console.error(chalk.red(`Error: ${error.message}`));
    }
  }
  
  async exportWallet(): Promise<void> {
    const accountId = await this.config.getConfig('accountId');
    const publicKey = await this.config.getConfig('publicKey');
    
    if (!accountId || !publicKey) {
      console.log(chalk.red('No account found. Create one with: aim account --create'));
      return;
    }
    
    const { password } = await inquirer.prompt([
      {
        type: 'password',
        name: 'password',
        message: 'Enter password to decrypt your seed phrase:',
        mask: '*'
      }
    ]);
    
    try {
      const encryptedSeed = await this.config.getConfig('encryptedSeed');
      const iv = await this.config.getConfig('seedIV');
      const authTag = await this.config.getConfig('seedAuthTag');
      
      if (!encryptedSeed || !iv || !authTag) {
        console.log(chalk.red('No encrypted seed phrase found'));
        return;
      }
      
      const seedPhrase = SeedManager.decryptSeedPhrase(encryptedSeed, password, iv, authTag);
      
      // Create wallet backup
      const backup = CryptoUtils.createWalletBackup(seedPhrase, publicKey, accountId);
      
      console.log(chalk.blue.bold('\nWallet Backup\n'));
      console.log(chalk.white('Save this backup in a secure location:'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.green(backup));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.yellow('\nWARNING: Keep this backup secure - it contains your seed phrase!'));
      
    } catch (error) {
      console.log(chalk.red('Invalid password or corrupted data'));
    }
  }
  
  async importWallet(): Promise<void> {
    console.log(chalk.blue.bold('\nImport Wallet Backup\n'));
    
    const { backupJson } = await inquirer.prompt([
      {
        type: 'editor',
        name: 'backupJson',
        message: 'Paste your wallet backup JSON:',
        default: ''
      }
    ]);
    
    if (!CryptoUtils.validateWalletBackup(backupJson)) {
      console.log(chalk.red('Invalid wallet backup format'));
      return;
    }
    
    try {
      const backup = JSON.parse(backupJson);
      
      // Derive keys from seed phrase
      const seed = SeedManager.seedPhraseToSeed(backup.seedPhrase);
      const privateKey = SeedManager.derivePrivateKey(seed);
      const publicKey = SeedManager.derivePublicKey(privateKey);
      
      // Verify public key matches
      if (publicKey.toString('hex') !== backup.publicKey) {
        console.log(chalk.red('Public key mismatch in backup'));
        return;
      }
      
      // Save encrypted seed phrase
      await this.saveEncryptedSeed(backup.seedPhrase, privateKey);
      
      // Save account info
      await this.config.setConfig('accountId', backup.accountId);
      await this.config.setConfig('publicKey', backup.publicKey);
      
      console.log(chalk.green('\nWallet imported successfully!'));
      console.log(chalk.white(`   Account ID: ${backup.accountId}`));
      console.log(chalk.white(`   Public Key: ${backup.publicKey}`));
      
    } catch (error) {
      console.log(chalk.red('Failed to import wallet backup'));
    }
  }
}
