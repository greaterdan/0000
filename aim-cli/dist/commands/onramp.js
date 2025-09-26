"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnrampManager = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const table_1 = require("table");
const config_1 = require("./config");
const api_client_1 = require("../utils/api-client");
const aim_utils_1 = require("../utils/aim-utils");
class OnrampManager {
    constructor() {
        this.config = new config_1.ConfigManager();
        this.api = new api_client_1.ApiClient();
    }
    async createBuyIntent(crypto, amount) {
        const accountId = await this.config.getConfig('accountId');
        if (!accountId) {
            console.log(chalk_1.default.red('No account found. Create one with: aim account --create'));
            return;
        }
        console.log(chalk_1.default.blue.bold('\n💰 Buy AIM with Cryptocurrency\n'));
        // Get crypto type
        let cryptoType = crypto;
        if (!cryptoType) {
            const cryptoAnswer = await inquirer_1.default.prompt([
                {
                    type: 'list',
                    name: 'crypto',
                    message: 'Select cryptocurrency:',
                    choices: [
                        { name: 'Bitcoin (BTC) - $45,000', value: 'BTC' },
                        { name: 'Ethereum (ETH) - $3,000', value: 'ETH' },
                        { name: 'Solana (SOL) - $100', value: 'SOL' },
                        { name: 'Monero (XMR) - $150', value: 'XMR' }
                    ]
                }
            ]);
            cryptoType = cryptoAnswer.crypto;
        }
        // Get amount
        let cryptoAmount = amount;
        if (!cryptoAmount) {
            const amountAnswer = await inquirer_1.default.prompt([
                {
                    type: 'input',
                    name: 'amount',
                    message: `Amount of ${cryptoType} to send:`,
                    validate: (input) => {
                        const num = parseFloat(input);
                        if (isNaN(num) || num <= 0) {
                            return 'Amount must be a positive number';
                        }
                        return true;
                    }
                }
            ]);
            cryptoAmount = amountAnswer.amount;
        }
        const spinner = (0, ora_1.default)('Creating buy intent...').start();
        try {
            const intent = await this.api.createOnrampIntent(accountId, cryptoType, cryptoAmount);
            spinner.succeed('Buy intent created!');
            console.log(chalk_1.default.green('\n✅ Buy Intent Created\n'));
            console.log(chalk_1.default.white(`   Intent ID: ${intent.intentId}`));
            console.log(chalk_1.default.white(`   Crypto: ${intent.crypto}`));
            console.log(chalk_1.default.white(`   Amount: ${intent.amount} ${cryptoType}`));
            console.log(chalk_1.default.white(`   AIM Amount: ${(0, aim_utils_1.formatAim)(intent.aimAmount, 6)} AIM`));
            console.log(chalk_1.default.white(`   Status: ${intent.status}`));
            console.log(chalk_1.default.white(`   Expires: ${new Date(intent.expiresAt).toLocaleString()}`));
            console.log(chalk_1.default.blue.bold('\n📨 Send Cryptocurrency\n'));
            console.log(chalk_1.default.white(`Send exactly ${intent.amount} ${cryptoType} to:`));
            console.log(chalk_1.default.green.bold(`   ${intent.depositAddress}\n`));
            console.log(chalk_1.default.yellow('⚠️  Important:'));
            console.log(chalk_1.default.gray('   • Send the exact amount or the transaction will fail'));
            console.log(chalk_1.default.gray('   • Wait for 3+ confirmations before AIM is credited'));
            console.log(chalk_1.default.gray('   • This address expires in 24 hours'));
            console.log(chalk_1.default.gray('   • Each intent gets a unique deposit address\n'));
            console.log(chalk_1.default.blue('💡 Next steps:'));
            console.log(chalk_1.default.gray('   aim onramp --status ' + intent.intentId + '    Check status'));
            console.log(chalk_1.default.gray('   aim onramp --list                    List all intents'));
            console.log(chalk_1.default.gray('   aim balance                          Check balance after confirmation'));
        }
        catch (error) {
            spinner.fail('Failed to create buy intent');
            console.error(chalk_1.default.red(`Error: ${error.message}`));
        }
    }
    async listIntents() {
        const accountId = await this.config.getConfig('accountId');
        if (!accountId) {
            console.log(chalk_1.default.red('No account found. Create one with: aim account --create'));
            return;
        }
        const spinner = (0, ora_1.default)('Loading on-ramp intents...').start();
        try {
            const intents = await this.api.listOnrampIntents(accountId);
            spinner.succeed('Intents loaded');
            if (intents.length === 0) {
                console.log(chalk_1.default.yellow('\n📭 No on-ramp intents found.'));
                console.log(chalk_1.default.gray('Create one with: aim buy --crypto BTC'));
                return;
            }
            console.log(chalk_1.default.blue.bold('\n📋 On-Ramp Intents\n'));
            const tableData = [
                ['ID', 'Crypto', 'Amount', 'AIM Amount', 'Status', 'Created']
            ];
            intents.forEach(intent => {
                tableData.push([
                    intent.id.substring(0, 8) + '...',
                    intent.crypto,
                    intent.amount,
                    (0, aim_utils_1.formatAim)(intent.aimAmount, 2),
                    intent.status,
                    new Date(intent.createdAt).toLocaleDateString()
                ]);
            });
            console.log((0, table_1.table)(tableData, {
                border: {
                    topBody: '─',
                    topJoin: '┬',
                    topLeft: '┌',
                    topRight: '┐',
                    bottomBody: '─',
                    bottomJoin: '┴',
                    bottomLeft: '└',
                    bottomRight: '┘',
                    bodyLeft: '│',
                    bodyRight: '│',
                    bodyJoin: '│',
                    joinBody: '─',
                    joinLeft: '├',
                    joinRight: '┤',
                    joinJoin: '┼'
                }
            }));
        }
        catch (error) {
            spinner.fail('Failed to load intents');
            console.error(chalk_1.default.red(`Error: ${error.message}`));
        }
    }
    async checkIntentStatus(intentId) {
        const spinner = (0, ora_1.default)('Checking intent status...').start();
        try {
            const intent = await this.api.getOnrampIntent(intentId);
            spinner.succeed('Intent status loaded');
            console.log(chalk_1.default.blue.bold('\n📊 Intent Status\n'));
            console.log(chalk_1.default.white(`   ID: ${intent.id}`));
            console.log(chalk_1.default.white(`   Crypto: ${intent.crypto}`));
            console.log(chalk_1.default.white(`   Amount: ${intent.amount} ${intent.crypto}`));
            console.log(chalk_1.default.white(`   AIM Amount: ${(0, aim_utils_1.formatAim)(intent.aimAmount, 6)} AIM`));
            console.log(chalk_1.default.white(`   Status: ${intent.status}`));
            console.log(chalk_1.default.white(`   Deposit Address: ${intent.depositAddress}`));
            console.log(chalk_1.default.white(`   Created: ${new Date(intent.createdAt).toLocaleString()}`));
            console.log(chalk_1.default.white(`   Expires: ${new Date(intent.expiresAt).toLocaleString()}`));
            if (intent.txHash) {
                console.log(chalk_1.default.white(`   Transaction Hash: ${intent.txHash}`));
                console.log(chalk_1.default.white(`   Confirmations: ${intent.confirmations || 0}`));
            }
            // Status-specific messages
            switch (intent.status) {
                case 'pending':
                    console.log(chalk_1.default.yellow('\n⏳ Waiting for deposit...'));
                    console.log(chalk_1.default.gray('Send the crypto to the deposit address above.'));
                    break;
                case 'confirmed':
                    console.log(chalk_1.default.blue('\n✅ Deposit confirmed!'));
                    console.log(chalk_1.default.gray('AIM tokens should be credited to your account shortly.'));
                    break;
                case 'completed':
                    console.log(chalk_1.default.green('\n🎉 Transaction completed!'));
                    console.log(chalk_1.default.gray('AIM tokens have been credited to your account.'));
                    break;
                case 'expired':
                    console.log(chalk_1.default.red('\n❌ Intent expired'));
                    console.log(chalk_1.default.gray('Create a new intent to buy AIM.'));
                    break;
            }
        }
        catch (error) {
            spinner.fail('Failed to check intent status');
            console.error(chalk_1.default.red(`Error: ${error.message}`));
        }
    }
}
exports.OnrampManager = OnrampManager;
//# sourceMappingURL=onramp.js.map