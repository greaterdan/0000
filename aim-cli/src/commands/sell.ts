import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { ConfigManager } from './config';
import { ApiClient } from '../utils/api-client';
import { formatAim, aimToMicroAim } from '../utils/aim-utils';

export class SellManager {
  private config: ConfigManager;
  private api: ApiClient;

  constructor() {
    this.config = new ConfigManager();
    this.api = new ApiClient();
  }

  async sellTokens(amount?: string, crypto?: string): Promise<void> {
    const accountId = await this.config.getConfig('accountId');
    
    if (!accountId) {
      console.log(chalk.red('No account found. Create one with: aim account --create'));
      return;
    }

    console.log(chalk.blue.bold('\n💸 Sell AIM Tokens for SOL\n'));

    // Get amount to sell
    let sellAmount = amount;
    if (!sellAmount) {
      const amountAnswer = await inquirer.prompt([
        {
          type: 'input',
          name: 'amount',
          message: 'Amount of AIM to sell:',
          validate: (input: string) => {
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
      console.log(chalk.red(`\n❌ Only SOL (Solana) is supported for selling AIM!`));
      console.log(chalk.yellow(`   You can only sell AIM for SOL tokens.`));
      return;
    }

    const spinner = ora('Checking balance and rates...').start();

    try {
      // Check current balance
      const balance = await this.api.getBalance(accountId);
      const currentBalance = parseFloat(balance.microAmount) / 1000000;
      const sellAmountNum = parseFloat(sellAmount!);

      if (sellAmountNum > currentBalance) {
        spinner.fail('Insufficient balance');
        console.log(chalk.red(`\n❌ Insufficient balance!`));
        console.log(chalk.white(`   Current: ${formatAim(balance.microAmount, 6)} AIM`));
        console.log(chalk.white(`   Trying to sell: ${sellAmount} AIM`));
        console.log(chalk.yellow('\n💡 Buy more AIM: aim buy --crypto BTC'));
        return;
      }

      // Get current rates
      const rates = await this.api.getTreasuryRates();
      const usdValue = sellAmountNum * rates.usdBid; // Use bid price (what you get selling)
      
      spinner.succeed('Balance and rates verified');

      // Show sell summary
      console.log(chalk.blue('\n📋 Sell Summary:'));
      console.log(chalk.white(`   Selling: ${sellAmount} AIM`));
      console.log(chalk.white(`   Current Price: $${rates.usdBid.toFixed(2)} per AIM (bid)`));
      console.log(chalk.white(`   USD Value: $${usdValue.toFixed(2)}`));
      console.log(chalk.white(`   Payout Crypto: SOL (Solana)`));
      console.log(chalk.white(`   Treasury Reserves: $${rates.treasuryReserves.toLocaleString()}`));

      // Confirm transaction
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Confirm this sell order?',
          default: false
        }
      ]);

      if (!confirm) {
        console.log(chalk.yellow('Sell order cancelled.'));
        return;
      }

      // Execute sell
      const sellSpinner = ora('Executing sell order...').start();
      
      const microAmount = aimToMicroAim(sellAmountNum);
      const response = await this.api.sellAim(accountId, microAmount.toString(), usdValue, cryptoType!);
      
      sellSpinner.succeed('Sell order executed successfully!');

      console.log(chalk.green('\n✅ Sell Order Details:'));
      console.log(chalk.white(`   Transaction ID: ${response.id}`));
      console.log(chalk.white(`   AIM Sold: ${sellAmount} AIM`));
      console.log(chalk.white(`   USD Value: $${usdValue.toFixed(2)}`));
      console.log(chalk.white(`   Price: $${rates.usdBid.toFixed(2)} per AIM`));
      console.log(chalk.white(`   Payout Crypto: SOL (Solana)`));
      console.log(chalk.white(`   Status: ${response.status}`));
      console.log(chalk.white(`   Timestamp: ${new Date(response.timestamp).toLocaleString()}`));

      console.log(chalk.blue('\n💡 Next steps:'));
      console.log(chalk.gray('   aim balance                          Check updated balance'));
      console.log(chalk.gray('   aim history                          View transaction history'));
      console.log(chalk.gray('   aim sell --list                      List all sell orders'));

    } catch (error: any) {
      spinner.fail('Sell order failed');
      console.error(chalk.red(`Error: ${error.message}`));
      
      if (error.message.includes('insufficient treasury reserves')) {
        console.log(chalk.yellow('\n💡 Treasury may not have enough reserves for this sale.'));
        console.log(chalk.gray('Try selling a smaller amount or check back later.'));
      } else if (error.message.includes('daily limit exceeded')) {
        console.log(chalk.yellow('\n💡 Daily sell limit exceeded.'));
        console.log(chalk.gray('Try again tomorrow or sell a smaller amount.'));
      }
    }
  }

  async listSellOrders(): Promise<void> {
    const accountId = await this.config.getConfig('accountId');
    
    if (!accountId) {
      console.log(chalk.red('No account found. Create one with: aim account --create'));
      return;
    }

    const spinner = ora('Loading sell orders...').start();

    try {
      const orders = await this.api.getSellOrders(accountId);
      
      spinner.succeed('Sell orders loaded');

      if (orders.length === 0) {
        console.log(chalk.yellow('\n📭 No sell orders found.'));
        console.log(chalk.gray('Create one with: aim sell --amount 100'));
        return;
      }

      console.log(chalk.blue.bold('\n📋 Sell Orders\n'));

      orders.forEach((order, index) => {
        console.log(chalk.white(`   ${index + 1}. Order ID: ${order.id.substring(0, 8)}...`));
        console.log(chalk.white(`      AIM Sold: ${formatAim(order.aimAmount, 2)}`));
        console.log(chalk.white(`      USD Value: $${order.usdValue.toFixed(2)}`));
        console.log(chalk.white(`      Price: $${order.price.toFixed(2)} per AIM`));
        console.log(chalk.white(`      Payout Crypto: ${order.payoutCrypto}`));
        console.log(chalk.white(`      Status: ${order.status}`));
        console.log(chalk.white(`      Created: ${new Date(order.timestamp).toLocaleString()}`));
        console.log('');
      });

    } catch (error: any) {
      spinner.fail('Failed to load sell orders');
      console.error(chalk.red(`Error: ${error.message}`));
    }
  }

  async checkSellOrderStatus(orderId: string): Promise<void> {
    const spinner = ora('Checking sell order status...').start();

    try {
      const order = await this.api.getSellOrder(orderId);
      
      spinner.succeed('Sell order status loaded');

      console.log(chalk.blue.bold('\n📊 Sell Order Status\n'));
      console.log(chalk.white(`   Order ID: ${order.id}`));
      console.log(chalk.white(`   AIM Sold: ${formatAim(order.aimAmount, 2)}`));
      console.log(chalk.white(`   USD Value: $${order.usdValue.toFixed(2)}`));
      console.log(chalk.white(`   Price: $${order.price.toFixed(2)} per AIM`));
      console.log(chalk.white(`   Payout Crypto: ${order.payoutCrypto}`));
      console.log(chalk.white(`   Status: ${order.status}`));
      console.log(chalk.white(`   Created: ${new Date(order.timestamp).toLocaleString()}`));

      if (order.payoutAddress) {
        console.log(chalk.white(`   Payout Address: ${order.payoutAddress}`));
      }

      if (order.payoutTxHash) {
        console.log(chalk.white(`   Payout Transaction: ${order.payoutTxHash}`));
      }

      // Status-specific messages
      switch (order.status) {
        case 'pending':
          console.log(chalk.yellow('\n⏳ Sell order pending...'));
          console.log(chalk.gray('Your AIM tokens are being processed for sale.'));
          break;
        case 'processing':
          console.log(chalk.blue('\n🔄 Processing sell order...'));
          console.log(chalk.gray('Converting AIM to cryptocurrency payout.'));
          break;
        case 'completed':
          console.log(chalk.green('\n🎉 Sell order completed!'));
          console.log(chalk.gray('Cryptocurrency has been sent to your payout address.'));
          break;
        case 'failed':
          console.log(chalk.red('\n❌ Sell order failed'));
          console.log(chalk.gray('Contact support if this persists.'));
          break;
      }

    } catch (error: any) {
      spinner.fail('Failed to check sell order status');
      console.error(chalk.red(`Error: ${error.message}`));
    }
  }
}
