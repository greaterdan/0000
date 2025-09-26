"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountManager = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const qrcode_terminal_1 = __importDefault(require("qrcode-terminal"));
const config_1 = require("./config");
const api_client_1 = require("../utils/api-client");
const seed_manager_1 = require("../utils/seed-manager");
const crypto_utils_1 = require("../utils/crypto-utils");
class AccountManager {
    constructor() {
        this.config = new config_1.ConfigManager();
        this.api = new api_client_1.ApiClient();
    }
    async createAccount() {
        console.log(chalk_1.default.blue.bold('\nWelcome to AIM Wallet!\n'));
        console.log(chalk_1.default.gray('Let\'s create your secure wallet in just a few steps.\n'));
        // Generate seed phrase and quantum-safe key pair
        const seedPhrase = seed_manager_1.SeedManager.generateSeedPhrase();
        const { publicKey, privateKey } = seed_manager_1.SeedManager.deriveQuantumKeyPair(seedPhrase);
        console.log(chalk_1.default.cyan('Generated quantum-safe wallet with Dilithium3 cryptography'));
        // Show seed phrase to user
        console.log(chalk_1.default.yellow.bold('Step 1: Save Your Recovery Phrase'));
        console.log(chalk_1.default.white('Write down these 24 words in order:'));
        console.log(chalk_1.default.green.bold(`\n${seedPhrase}\n`));
        console.log(chalk_1.default.red('WARNING: Keep this safe! Anyone with these words can access your wallet.\n'));
        // Confirm user saved seed phrase
        const { confirmed } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'confirmed',
                message: 'I have written down my recovery phrase safely',
                default: false
            }
        ]);
        if (!confirmed) {
            console.log(chalk_1.default.red('\nPlease write down your recovery phrase first!'));
            console.log(chalk_1.default.yellow('Run "aim setup" again when you\'re ready.\n'));
            return;
        }
        console.log(chalk_1.default.yellow.bold('\nStep 2: Your Information'));
        const answers = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'displayName',
                message: 'What should we call you?',
                default: 'User',
                validate: (input) => {
                    if (!input.trim()) {
                        return 'Please enter a name';
                    }
                    return true;
                }
            }
        ]);
        const spinner = (0, ora_1.default)('Creating account...').start();
        try {
            // Create account with public key
            const response = await this.api.createAccount(answers.displayName, 'human', publicKey.toString('hex'));
            spinner.succeed('Account created successfully!');
            console.log(chalk_1.default.yellow.bold('\nStep 3: Secure Your Wallet'));
            // Save encrypted seed phrase to config
            await this.saveEncryptedSeed(seedPhrase, privateKey);
            // Save account info
            await this.config.setConfig('accountId', response.id);
            await this.config.setConfig('displayName', response.displayName);
            await this.config.setConfig('accountKind', 'human');
            await this.config.setConfig('publicKey', publicKey.toString('hex'));
            console.log(chalk_1.default.green.bold('\nWallet Created Successfully!'));
            console.log(chalk_1.default.white(`   Name: ${response.displayName}`));
            console.log(chalk_1.default.white(`   Wallet ID: ${response.id.substring(0, 8)}...`));
            console.log(chalk_1.default.white(`   Status: Active`));
            console.log(chalk_1.default.blue.bold('\nWhat\'s Next?'));
            console.log(chalk_1.default.white('   • Check balance: aim balance'));
            console.log(chalk_1.default.white('   • Buy tokens: aim buy'));
            console.log(chalk_1.default.white('   • Send tokens: aim send'));
            console.log(chalk_1.default.white('   • Export backup: aim backup\n'));
            console.log(chalk_1.default.gray('Your wallet is secure and ready to use!'));
        }
        catch (error) {
            spinner.fail('Failed to create account');
            console.error(chalk_1.default.red(`Error: ${error.message}`));
            process.exit(1);
        }
    }
    async showAccountInfo() {
        const accountId = await this.config.getConfig('accountId');
        if (!accountId) {
            console.log(chalk_1.default.red('No account found. Create one with: aim account --create'));
            return;
        }
        const spinner = (0, ora_1.default)('Loading account info...').start();
        try {
            const account = await this.api.getAccount(accountId);
            spinner.succeed('Account loaded');
            console.log(chalk_1.default.blue.bold('\n👤 Account Information\n'));
            console.log(chalk_1.default.white(`   ID: ${account.id}`));
            console.log(chalk_1.default.white(`   Name: ${account.displayName}`));
            console.log(chalk_1.default.white(`   Type: ${account.kind}`));
            console.log(chalk_1.default.white(`   Status: ${account.status}`));
            console.log(chalk_1.default.white(`   Reputation: ${account.reputationScore}`));
            console.log(chalk_1.default.white(`   TPM Attested: ${account.tpmAttested ? 'Yes' : 'No'}`));
            console.log(chalk_1.default.white(`   Created: ${new Date(account.createdAt).toLocaleString()}`));
        }
        catch (error) {
            spinner.fail('Failed to load account');
            console.error(chalk_1.default.red(`Error: ${error.message}`));
        }
    }
    async showReceiveAddress() {
        const accountId = await this.config.getConfig('accountId');
        if (!accountId) {
            console.log(chalk_1.default.red('No account found. Create one with: aim account --create'));
            return;
        }
        console.log(chalk_1.default.blue.bold('\n📨 Receive AIM Tokens\n'));
        console.log(chalk_1.default.white('Your account address:'));
        console.log(chalk_1.default.green.bold(`   ${accountId}\n`));
        console.log(chalk_1.default.gray('Share this address with others to receive AIM tokens.'));
        console.log(chalk_1.default.gray('You can also generate a QR code for easy sharing.\n'));
        const { showQR } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'showQR',
                message: 'Show QR code?',
                default: true
            }
        ]);
        if (showQR) {
            console.log(chalk_1.default.blue('\n📱 QR Code:'));
            qrcode_terminal_1.default.generate(accountId, { small: true });
        }
    }
    async saveEncryptedSeed(seedPhrase, privateKey) {
        // Prompt for encryption password
        const { password } = await inquirer_1.default.prompt([
            {
                type: 'password',
                name: 'password',
                message: 'Create a password to protect your wallet:',
                mask: '*',
                validate: (input) => {
                    if (!input || input.length < 6) {
                        return 'Password must be at least 6 characters long';
                    }
                    return true;
                }
            }
        ]);
        // Encrypt seed phrase with quantum-safe encryption
        const encrypted = seed_manager_1.SeedManager.encryptSeedPhraseQuantum(seedPhrase, password);
        // Save encrypted data
        await this.config.setConfig('encryptedSeed', encrypted.encrypted);
        await this.config.setConfig('seedIV', encrypted.iv);
        await this.config.setConfig('seedAuthTag', encrypted.authTag);
        await this.config.setConfig('hasSeed', 'true');
        await this.config.setConfig('cryptoType', 'quantum-safe');
        console.log(chalk_1.default.green('Wallet secured with quantum-safe cryptography'));
    }
    async restoreAccount() {
        console.log(chalk_1.default.blue.bold('\nRestore AIM Account\n'));
        const { seedPhrase } = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'seedPhrase',
                message: 'Enter your 24-word seed phrase:',
                validate: (input) => {
                    if (!seed_manager_1.SeedManager.validateSeedPhrase(input)) {
                        return 'Invalid seed phrase format';
                    }
                    return true;
                }
            }
        ]);
        // Derive quantum-safe keys from seed phrase
        const { publicKey, privateKey } = seed_manager_1.SeedManager.deriveQuantumKeyPair(seedPhrase);
        console.log(chalk_1.default.cyan('Restoring quantum-safe wallet with Dilithium3 cryptography'));
        // Look up account by public key
        const spinner = (0, ora_1.default)('Looking up account...').start();
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
            console.log(chalk_1.default.green('\nAccount Restored:'));
            console.log(chalk_1.default.white(`   ID: ${account.id}`));
            console.log(chalk_1.default.white(`   Name: ${account.displayName}`));
            console.log(chalk_1.default.white(`   Type: ${account.kind}`));
        }
        catch (error) {
            spinner.fail('Account not found');
            console.error(chalk_1.default.red(`Error: ${error.message}`));
        }
    }
    async exportWallet() {
        const accountId = await this.config.getConfig('accountId');
        const publicKey = await this.config.getConfig('publicKey');
        if (!accountId || !publicKey) {
            console.log(chalk_1.default.red('No account found. Create one with: aim account --create'));
            return;
        }
        const { password } = await inquirer_1.default.prompt([
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
                console.log(chalk_1.default.red('No encrypted seed phrase found'));
                return;
            }
            const seedPhrase = seed_manager_1.SeedManager.decryptSeedPhrase(encryptedSeed, password, iv, authTag);
            // Create wallet backup
            const backup = crypto_utils_1.CryptoUtils.createWalletBackup(seedPhrase, publicKey, accountId);
            console.log(chalk_1.default.blue.bold('\nWallet Backup\n'));
            console.log(chalk_1.default.white('Save this backup in a secure location:'));
            console.log(chalk_1.default.gray('─'.repeat(50)));
            console.log(chalk_1.default.green(backup));
            console.log(chalk_1.default.gray('─'.repeat(50)));
            console.log(chalk_1.default.yellow('\nWARNING: Keep this backup secure - it contains your seed phrase!'));
        }
        catch (error) {
            console.log(chalk_1.default.red('Invalid password or corrupted data'));
        }
    }
    async importWallet() {
        console.log(chalk_1.default.blue.bold('\nImport Wallet Backup\n'));
        const { backupJson } = await inquirer_1.default.prompt([
            {
                type: 'editor',
                name: 'backupJson',
                message: 'Paste your wallet backup JSON:',
                default: ''
            }
        ]);
        if (!crypto_utils_1.CryptoUtils.validateWalletBackup(backupJson)) {
            console.log(chalk_1.default.red('Invalid wallet backup format'));
            return;
        }
        try {
            const backup = JSON.parse(backupJson);
            // Derive keys from seed phrase
            const seed = seed_manager_1.SeedManager.seedPhraseToSeed(backup.seedPhrase);
            const privateKey = seed_manager_1.SeedManager.derivePrivateKey(seed);
            const publicKey = seed_manager_1.SeedManager.derivePublicKey(privateKey);
            // Verify public key matches
            if (publicKey.toString('hex') !== backup.publicKey) {
                console.log(chalk_1.default.red('Public key mismatch in backup'));
                return;
            }
            // Save encrypted seed phrase
            await this.saveEncryptedSeed(backup.seedPhrase, privateKey);
            // Save account info
            await this.config.setConfig('accountId', backup.accountId);
            await this.config.setConfig('publicKey', backup.publicKey);
            console.log(chalk_1.default.green('\nWallet imported successfully!'));
            console.log(chalk_1.default.white(`   Account ID: ${backup.accountId}`));
            console.log(chalk_1.default.white(`   Public Key: ${backup.publicKey}`));
        }
        catch (error) {
            console.log(chalk_1.default.red('Failed to import wallet backup'));
        }
    }
}
exports.AccountManager = AccountManager;
//# sourceMappingURL=account.js.map