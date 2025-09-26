"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferManager = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const config_1 = require("./config");
const api_client_1 = require("../utils/api-client");
const aim_utils_1 = require("../utils/aim-utils");
const seed_manager_1 = require("../utils/seed-manager");
class TransferManager {
    constructor() {
        this.config = new config_1.ConfigManager();
        this.api = new api_client_1.ApiClient();
    }
    async sendTokens(toAccountId, amount, memo) {
        const fromAccountId = await this.config.getConfig('accountId');
        if (!fromAccountId) {
            console.log(chalk_1.default.red('No account found. Create one with: aim account --create'));
            return;
        }
        console.log(chalk_1.default.blue.bold('\n💸 Send AIM Tokens\n'));
        // Get recipient account ID
        let recipientId = toAccountId;
        if (!recipientId) {
            const recipientAnswer = await inquirer_1.default.prompt([
                {
                    type: 'input',
                    name: 'toAccountId',
                    message: 'Recipient account ID:',
                    validate: (input) => {
                        if (!input.trim()) {
                            return 'Recipient account ID is required';
                        }
                        if (input.length < 10) {
                            return 'Invalid account ID format';
                        }
                        return true;
                    }
                }
            ]);
            recipientId = recipientAnswer.toAccountId;
        }
        // Get amount
        let transferAmount = amount;
        if (!transferAmount) {
            const amountAnswer = await inquirer_1.default.prompt([
                {
                    type: 'input',
                    name: 'amount',
                    message: 'Amount to send (in AIM):',
                    validate: (input) => {
                        const num = parseFloat(input);
                        if (isNaN(num) || num <= 0) {
                            return 'Amount must be a positive number';
                        }
                        return true;
                    }
                }
            ]);
            transferAmount = amountAnswer.amount;
        }
        // Get memo
        let transferMemo = memo;
        if (!transferMemo) {
            const memoAnswer = await inquirer_1.default.prompt([
                {
                    type: 'input',
                    name: 'memo',
                    message: 'Memo (optional):',
                    default: ''
                }
            ]);
            transferMemo = memoAnswer.memo || undefined;
        }
        // Check balance first
        const spinner = (0, ora_1.default)('Checking balance...').start();
        try {
            const balance = await this.api.getBalance(fromAccountId);
            const currentBalance = parseFloat(balance.microAmount) / 1000000;
            const sendAmount = parseFloat(transferAmount);
            if (sendAmount > currentBalance) {
                spinner.fail('Insufficient balance');
                console.log(chalk_1.default.red(`\n❌ Insufficient balance!`));
                console.log(chalk_1.default.white(`   Current: ${(0, aim_utils_1.formatAim)(balance.microAmount, 6)} AIM`));
                console.log(chalk_1.default.white(`   Trying to send: ${transferAmount} AIM`));
                console.log(chalk_1.default.yellow('\n💡 Buy more AIM: aim buy --crypto BTC'));
                return;
            }
            spinner.succeed('Balance verified');
            // Confirm transaction
            console.log(chalk_1.default.blue('\n📋 Transaction Summary:'));
            console.log(chalk_1.default.white(`   From: ${fromAccountId}`));
            console.log(chalk_1.default.white(`   To: ${recipientId}`));
            console.log(chalk_1.default.white(`   Amount: ${transferAmount} AIM`));
            if (transferMemo) {
                console.log(chalk_1.default.white(`   Memo: ${transferMemo}`));
            }
            console.log(chalk_1.default.white(`   Fee: 0 AIM (no fees)`));
            const { confirm } = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: 'Confirm this transaction?',
                    default: false
                }
            ]);
            if (!confirm) {
                console.log(chalk_1.default.yellow('Transaction cancelled.'));
                return;
            }
            // Send transaction with quantum-safe signature
            const sendSpinner = (0, ora_1.default)('Signing and sending transaction...').start();
            const microAmount = (0, aim_utils_1.aimToMicroAim)(parseFloat(transferAmount));
            // Create transaction data for signing
            const transactionData = {
                from: fromAccountId,
                to: recipientId,
                microAmount: microAmount.toString(),
                memo: transferMemo,
                timestamp: Date.now(),
                nonce: seed_manager_1.SeedManager.generateNonce()
            };
            // Get private key for signing
            const encryptedSeed = await this.config.getConfig('encryptedSeed');
            const seedIV = await this.config.getConfig('seedIV');
            const seedAuthTag = await this.config.getConfig('seedAuthTag');
            if (!encryptedSeed || !seedIV || !seedAuthTag) {
                sendSpinner.fail('No wallet found');
                console.log(chalk_1.default.red('Please create or restore a wallet first'));
                return;
            }
            // Prompt for password to decrypt seed
            const { password } = await inquirer_1.default.prompt([
                {
                    type: 'password',
                    name: 'password',
                    message: 'Enter wallet password to sign transaction:',
                    mask: '*'
                }
            ]);
            // Decrypt seed phrase
            const seedPhrase = seed_manager_1.SeedManager.decryptSeedPhraseQuantum(encryptedSeed, password, seedIV, seedAuthTag);
            // Generate quantum-safe key pair
            const { privateKey } = seed_manager_1.SeedManager.deriveQuantumKeyPair(seedPhrase);
            // Create transaction hash and sign it
            const transactionHash = seed_manager_1.SeedManager.createTransactionHash(transactionData);
            const signature = seed_manager_1.SeedManager.signMessageQuantum(transactionHash, privateKey);
            // Send signed transaction
            const signedTransaction = {
                ...transactionData,
                signature: signature.toString('hex'),
                cryptoType: 'quantum-safe'
            };
            const response = await this.api.transferSigned(signedTransaction);
            sendSpinner.succeed('Quantum-safe transaction sent successfully!');
            console.log(chalk_1.default.green('\n✅ Transaction Details:'));
            console.log(chalk_1.default.white(`   Transaction ID: ${response.id}`));
            console.log(chalk_1.default.white(`   Amount: ${transferAmount} AIM`));
            console.log(chalk_1.default.white(`   Status: ${response.status}`));
            console.log(chalk_1.default.white(`   Timestamp: ${new Date(response.createdAt).toLocaleString()}`));
            console.log(chalk_1.default.blue('\n💡 Next steps:'));
            console.log(chalk_1.default.gray('   aim balance          Check your updated balance'));
            console.log(chalk_1.default.gray('   aim history          View transaction history'));
        }
        catch (error) {
            spinner.fail('Transfer failed');
            console.error(chalk_1.default.red(`Error: ${error.message}`));
        }
    }
}
exports.TransferManager = TransferManager;
//# sourceMappingURL=transfer.js.map