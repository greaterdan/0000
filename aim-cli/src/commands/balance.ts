import chalk from 'chalk';
import ora from 'ora';
import { ConfigManager } from './config';
import { ApiClient } from '../utils/api-client';
import { microAimToAim, formatAim } from '../utils/aim-utils';

export class BalanceManager {
  private config: ConfigManager;
  private api: ApiClient;

  constructor() {
    this.config = new ConfigManager();
    this.api = new ApiClient();
  }

  async showBalance(accountId?: string): Promise<void> {
    const targetAccountId = accountId || await this.config.getConfig('accountId');
    
    if (!targetAccountId) {
      console.log(chalk.red('No account ID provided. Create an account with: aim account --create'));
      return;
    }

    const spinner = ora('Loading balance...').start();

    try {
      const balance = await this.api.getBalance(targetAccountId);
      
      spinner.succeed('Balance loaded');

      const aimAmount = microAimToAim(balance.microAmount);
      const formattedAmount = formatAim(balance.microAmount, 6);

      console.log(chalk.blue.bold('\n💰 AIM Balance\n'));
      console.log(chalk.white(`   Account: ${targetAccountId}`));
      console.log(chalk.green.bold(`   Balance: ${formattedAmount} AIM`));
      console.log(chalk.gray(`   Raw: ${balance.microAmount} microAIM`));
      console.log(chalk.white(`   Updated: ${new Date(balance.updatedAt).toLocaleString()}`));

      // Show balance status
      if (aimAmount === 0) {
        console.log(chalk.yellow('\n💡 Your balance is empty. Buy some AIM:'));
        console.log(chalk.gray('   aim buy --crypto BTC --amount 0.01'));
      } else if (aimAmount < 1) {
        console.log(chalk.yellow('\n💡 Low balance. Consider buying more AIM:'));
        console.log(chalk.gray('   aim buy --crypto BTC --amount 0.01'));
      } else {
        console.log(chalk.green('\n✅ You have AIM tokens! You can:'));
        console.log(chalk.gray('   aim send --to <account-id> --amount 1'));
        console.log(chalk.gray('   aim history'));
      }

    } catch (error: any) {
      spinner.fail('Failed to load balance');
      console.error(chalk.red(`Error: ${error.message}`));
    }
  }
}
