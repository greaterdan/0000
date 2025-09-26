"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SellManager = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const config_1 = require("./config");
const api_client_1 = require("../utils/api-client");
const aim_utils_1 = require("../utils/aim-utils");
class SellManager {
    constructor() {
        this.config = new config_1.ConfigManager();
        this.api = new api_client_1.ApiClient();
    }
    async sellTokens(amount, crypto) {
        const accountId = await this.config.getConfig('accountId');
        if (!accountId) {
            console.log(chalk_1.default.red('No account found. Create one with: aim account --create'));
            return;
        }
        console.log(chalk_1.default.blue.bold('\n💸 Sell AIM Tokens for SOL\n'));
        // Get amount to sell
        let sellAmount = amount;
        if (!sellAmount) {
            const amountAnswer = await inquirer_1.default.prompt([
                {
                    type: 'input',
                    name: 'amount',
                    message: 'Amount of AIM to sell:',
                    validate: (input) => {
                        const num = parseFloat(input);
                        if (isNaN(num) || num <= 0) {
                            return 'Amount must be a positive number';
                        }
                        return true;
                    }
                }
            ]);
            sellAmount = amountAnswer.amount;
        }
        // Get crypto type for payout
        // Only allow selling AIM for SOL
        const cryptoType = 'SOL';
        if (crypto && crypto !== 'SOL') {
            console.log(chalk_1.default.red(`\n❌ Only SOL (Solana) is supported for selling AIM!`));
            console.log(chalk_1.default.yellow(`   You can only sell AIM for SOL tokens.`));
            return;
        }
        const spinner = (0, ora_1.default)('Checking balance and rates...').start();
        try {
            // Check current balance
            const balance = await this.api.getBalance(accountId);
            const currentBalance = parseFloat(balance.microAmount) / 1000000;
            const sellAmountNum = parseFloat(sellAmount);
            if (sellAmountNum > currentBalance) {
                spinner.fail('Insufficient balance');
                console.log(chalk_1.default.red(`\n❌ Insufficient balance!`));
                console.log(chalk_1.default.white(`   Current: ${(0, aim_utils_1.formatAim)(balance.microAmount, 6)} AIM`));
                console.log(chalk_1.default.white(`   Trying to sell: ${sellAmount} AIM`));
                console.log(chalk_1.default.yellow('\n💡 Buy more AIM: aim buy --crypto BTC'));
                return;
            }
            // Get current rates
            const rates = await this.api.getTreasuryRates();
            const usdValue = sellAmountNum * rates.usdBid; // Use bid price (what you get selling)
            spinner.succeed('Balance and rates verified');
            // Show sell summary
            console.log(chalk_1.default.blue('\n📋 Sell Summary:'));
            console.log(chalk_1.default.white(`   Selling: ${sellAmount} AIM`));
            console.log(chalk_1.default.white(`   Current Price: $${rates.usdBid.toFixed(2)} per AIM (bid)`));
            console.log(chalk_1.default.white(`   USD Value: $${usdValue.toFixed(2)}`));
            console.log(chalk_1.default.white(`   Payout Crypto: SOL (Solana)`));
            console.log(chalk_1.default.white(`   Treasury Reserves: $${rates.treasuryReserves.toLocaleString()}`));
            // Confirm transaction
            const { confirm } = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: 'Confirm this sell order?',
                    default: false
                }
            ]);
            if (!confirm) {
                console.log(chalk_1.default.yellow('Sell order cancelled.'));
                return;
            }
            // Execute sell
            const sellSpinner = (0, ora_1.default)('Executing sell order...').start();
            const microAmount = (0, aim_utils_1.aimToMicroAim)(sellAmountNum);
            const response = await this.api.sellAim(accountId, microAmount.toString(), usdValue, cryptoType);
            sellSpinner.succeed('Sell order executed successfully!');
            console.log(chalk_1.default.green('\n✅ Sell Order Details:'));
            console.log(chalk_1.default.white(`   Transaction ID: ${response.id}`));
            console.log(chalk_1.default.white(`   AIM Sold: ${sellAmount} AIM`));
            console.log(chalk_1.default.white(`   USD Value: $${usdValue.toFixed(2)}`));
            console.log(chalk_1.default.white(`   Price: $${rates.usdBid.toFixed(2)} per AIM`));
            console.log(chalk_1.default.white(`   Payout Crypto: SOL (Solana)`));
            console.log(chalk_1.default.white(`   Status: ${response.status}`));
            console.log(chalk_1.default.white(`   Timestamp: ${new Date(response.timestamp).toLocaleString()}`));
            console.log(chalk_1.default.blue('\n💡 Next steps:'));
            console.log(chalk_1.default.gray('   aim balance                          Check updated balance'));
            console.log(chalk_1.default.gray('   aim history                          View transaction history'));
            console.log(chalk_1.default.gray('   aim sell --list                      List all sell orders'));
        }
        catch (error) {
            spinner.fail('Sell order failed');
            console.error(chalk_1.default.red(`Error: ${error.message}`));
            if (error.message.includes('insufficient treasury reserves')) {
                console.log(chalk_1.default.yellow('\n💡 Treasury may not have enough reserves for this sale.'));
                console.log(chalk_1.default.gray('Try selling a smaller amount or check back later.'));
            }
            else if (error.message.includes('daily limit exceeded')) {
                console.log(chalk_1.default.yellow('\n💡 Daily sell limit exceeded.'));
                console.log(chalk_1.default.gray('Try again tomorrow or sell a smaller amount.'));
            }
        }
    }
    async listSellOrders() {
        const accountId = await this.config.getConfig('accountId');
        if (!accountId) {
            console.log(chalk_1.default.red('No account found. Create one with: aim account --create'));
            return;
        }
        const spinner = (0, ora_1.default)('Loading sell orders...').start();
        try {
            const orders = await this.api.getSellOrders(accountId);
            spinner.succeed('Sell orders loaded');
            if (orders.length === 0) {
                console.log(chalk_1.default.yellow('\n📭 No sell orders found.'));
                console.log(chalk_1.default.gray('Create one with: aim sell --amount 100'));
                return;
            }
            console.log(chalk_1.default.blue.bold('\n📋 Sell Orders\n'));
            orders.forEach((order, index) => {
                console.log(chalk_1.default.white(`   ${index + 1}. Order ID: ${order.id.substring(0, 8)}...`));
                console.log(chalk_1.default.white(`      AIM Sold: ${(0, aim_utils_1.formatAim)(order.aimAmount, 2)}`));
                console.log(chalk_1.default.white(`      USD Value: $${order.usdValue.toFixed(2)}`));
                console.log(chalk_1.default.white(`      Price: $${order.price.toFixed(2)} per AIM`));
                console.log(chalk_1.default.white(`      Payout Crypto: ${order.payoutCrypto}`));
                console.log(chalk_1.default.white(`      Status: ${order.status}`));
                console.log(chalk_1.default.white(`      Created: ${new Date(order.timestamp).toLocaleString()}`));
                console.log('');
            });
        }
        catch (error) {
            spinner.fail('Failed to load sell orders');
            console.error(chalk_1.default.red(`Error: ${error.message}`));
        }
    }
    async checkSellOrderStatus(orderId) {
        const spinner = (0, ora_1.default)('Checking sell order status...').start();
        try {
            const order = await this.api.getSellOrder(orderId);
            spinner.succeed('Sell order status loaded');
            console.log(chalk_1.default.blue.bold('\n📊 Sell Order Status\n'));
            console.log(chalk_1.default.white(`   Order ID: ${order.id}`));
            console.log(chalk_1.default.white(`   AIM Sold: ${(0, aim_utils_1.formatAim)(order.aimAmount, 2)}`));
            console.log(chalk_1.default.white(`   USD Value: $${order.usdValue.toFixed(2)}`));
            console.log(chalk_1.default.white(`   Price: $${order.price.toFixed(2)} per AIM`));
            console.log(chalk_1.default.white(`   Payout Crypto: ${order.payoutCrypto}`));
            console.log(chalk_1.default.white(`   Status: ${order.status}`));
            console.log(chalk_1.default.white(`   Created: ${new Date(order.timestamp).toLocaleString()}`));
            if (order.payoutAddress) {
                console.log(chalk_1.default.white(`   Payout Address: ${order.payoutAddress}`));
            }
            if (order.payoutTxHash) {
                console.log(chalk_1.default.white(`   Payout Transaction: ${order.payoutTxHash}`));
            }
            // Status-specific messages
            switch (order.status) {
                case 'pending':
                    console.log(chalk_1.default.yellow('\n⏳ Sell order pending...'));
                    console.log(chalk_1.default.gray('Your AIM tokens are being processed for sale.'));
                    break;
                case 'processing':
                    console.log(chalk_1.default.blue('\n🔄 Processing sell order...'));
                    console.log(chalk_1.default.gray('Converting AIM to cryptocurrency payout.'));
                    break;
                case 'completed':
                    console.log(chalk_1.default.green('\n🎉 Sell order completed!'));
                    console.log(chalk_1.default.gray('Cryptocurrency has been sent to your payout address.'));
                    break;
                case 'failed':
                    console.log(chalk_1.default.red('\n❌ Sell order failed'));
                    console.log(chalk_1.default.gray('Contact support if this persists.'));
                    break;
            }
        }
        catch (error) {
            spinner.fail('Failed to check sell order status');
            console.error(chalk_1.default.red(`Error: ${error.message}`));
        }
    }
}
exports.SellManager = SellManager;
//# sourceMappingURL=sell.js.map