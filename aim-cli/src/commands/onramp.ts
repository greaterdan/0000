import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { table } from 'table';
import { ConfigManager } from './config';
import { ApiClient } from '../utils/api-client';
import { formatAim } from '../utils/aim-utils';

export class OnrampManager {
  private config: ConfigManager;
  private api: ApiClient;

  constructor() {
    this.config = new ConfigManager();
    this.api = new ApiClient();
  }

  async createBuyIntent(crypto?: string, amount?: string): Promise<void> {
    const accountId = await this.config.getConfig('accountId');
    
    if (!accountId) {
      console.log(chalk.red('No account found. Create one with: aim account --create'));
      return;
    }

    console.log(chalk.blue.bold('\n💰 Buy AIM with Cryptocurrency\n'));

    // Get crypto type
    let cryptoType = crypto;
    if (!cryptoType) {
      const cryptoAnswer = await inquirer.prompt([
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
      const amountAnswer = await inquirer.prompt([
        {
          type: 'input',
          name: 'amount',
          message: `Amount of ${cryptoType} to send:`,
          validate: (input: string) => {
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

    const spinner = ora('Creating buy intent...').start();

    try {
      const intent = await this.api.createOnrampIntent(accountId, cryptoType, cryptoAmount);
      
      spinner.succeed('Buy intent created!');

      console.log(chalk.green('\n✅ Buy Intent Created\n'));
      console.log(chalk.white(`   Intent ID: ${intent.intentId}`));
      console.log(chalk.white(`   Crypto: ${intent.crypto}`));
      console.log(chalk.white(`   Amount: ${intent.amount} ${cryptoType}`));
      console.log(chalk.white(`   AIM Amount: ${formatAim(intent.aimAmount, 6)} AIM`));
      console.log(chalk.white(`   Status: ${intent.status}`));
      console.log(chalk.white(`   Expires: ${new Date(intent.expiresAt).toLocaleString()}`));

      console.log(chalk.blue.bold('\n📨 Send Cryptocurrency\n'));
      console.log(chalk.white(`Send exactly ${intent.amount} ${cryptoType} to:`));
      console.log(chalk.green.bold(`   ${intent.depositAddress}\n`));
      
      console.log(chalk.yellow('⚠️  Important:'));
      console.log(chalk.gray('   • Send the exact amount or the transaction will fail'));
      console.log(chalk.gray('   • Wait for 3+ confirmations before AIM is credited'));
      console.log(chalk.gray('   • This address expires in 24 hours'));
      console.log(chalk.gray('   • Each intent gets a unique deposit address\n'));

      console.log(chalk.blue('💡 Next steps:'));
      console.log(chalk.gray('   aim onramp --status ' + intent.intentId + '    Check status'));
      console.log(chalk.gray('   aim onramp --list                    List all intents'));
      console.log(chalk.gray('   aim balance                          Check balance after confirmation'));

    } catch (error: any) {
      spinner.fail('Failed to create buy intent');
      console.error(chalk.red(`Error: ${error.message}`));
    }
  }

  async listIntents(): Promise<void> {
    const accountId = await this.config.getConfig('accountId');
    
    if (!accountId) {
      console.log(chalk.red('No account found. Create one with: aim account --create'));
      return;
    }

    const spinner = ora('Loading on-ramp intents...').start();

    try {
      const intents = await this.api.listOnrampIntents(accountId);
      
      spinner.succeed('Intents loaded');

      if (intents.length === 0) {
        console.log(chalk.yellow('\n📭 No on-ramp intents found.'));
        console.log(chalk.gray('Create one with: aim buy --crypto BTC'));
        return;
      }

      console.log(chalk.blue.bold('\n📋 On-Ramp Intents\n'));

      const tableData = [
        ['ID', 'Crypto', 'Amount', 'AIM Amount', 'Status', 'Created']
      ];

      intents.forEach(intent => {
        tableData.push([
          intent.id.substring(0, 8) + '...',
          intent.crypto,
          intent.amount,
          formatAim(intent.aimAmount, 2),
          intent.status,
          new Date(intent.createdAt).toLocaleDateString()
        ]);
      });

      console.log(table(tableData, {
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

    } catch (error: any) {
      spinner.fail('Failed to load intents');
      console.error(chalk.red(`Error: ${error.message}`));
    }
  }

  async checkIntentStatus(intentId: string): Promise<void> {
    const spinner = ora('Checking intent status...').start();

    try {
      const intent = await this.api.getOnrampIntent(intentId);
      
      spinner.succeed('Intent status loaded');

      console.log(chalk.blue.bold('\n📊 Intent Status\n'));
      console.log(chalk.white(`   ID: ${intent.id}`));
      console.log(chalk.white(`   Crypto: ${intent.crypto}`));
      console.log(chalk.white(`   Amount: ${intent.amount} ${intent.crypto}`));
      console.log(chalk.white(`   AIM Amount: ${formatAim(intent.aimAmount, 6)} AIM`));
      console.log(chalk.white(`   Status: ${intent.status}`));
      console.log(chalk.white(`   Deposit Address: ${intent.depositAddress}`));
      console.log(chalk.white(`   Created: ${new Date(intent.createdAt).toLocaleString()}`));
      console.log(chalk.white(`   Expires: ${new Date(intent.expiresAt).toLocaleString()}`));

      if (intent.txHash) {
        console.log(chalk.white(`   Transaction Hash: ${intent.txHash}`));
        console.log(chalk.white(`   Confirmations: ${intent.confirmations || 0}`));
      }

      // Status-specific messages
      switch (intent.status) {
        case 'pending':
          console.log(chalk.yellow('\n⏳ Waiting for deposit...'));
          console.log(chalk.gray('Send the crypto to the deposit address above.'));
          break;
        case 'confirmed':
          console.log(chalk.blue('\n✅ Deposit confirmed!'));
          console.log(chalk.gray('AIM tokens should be credited to your account shortly.'));
          break;
        case 'completed':
          console.log(chalk.green('\n🎉 Transaction completed!'));
          console.log(chalk.gray('AIM tokens have been credited to your account.'));
          break;
        case 'expired':
          console.log(chalk.red('\n❌ Intent expired'));
          console.log(chalk.gray('Create a new intent to buy AIM.'));
          break;
      }

    } catch (error: any) {
      spinner.fail('Failed to check intent status');
      console.error(chalk.red(`Error: ${error.message}`));
    }
  }
}
