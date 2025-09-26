import chalk from 'chalk';
import ora from 'ora';
import { table } from 'table';
import { ConfigManager } from './config';
import { ApiClient } from '../utils/api-client';
import { formatAim } from '../utils/aim-utils';

export class HistoryManager {
  private config: ConfigManager;
  private api: ApiClient;

  constructor() {
    this.config = new ConfigManager();
    this.api = new ApiClient();
  }

  async showHistory(limit: number = 10): Promise<void> {
    const accountId = await this.config.getConfig('accountId');
    
    if (!accountId) {
      console.log(chalk.red('No account found. Create one with: aim account --create'));
      return;
    }

    const spinner = ora('Loading transaction history...').start();

    try {
      const transactions = await this.api.getTransactionHistory(accountId, limit);
      
      spinner.succeed('History loaded');

      if (transactions.length === 0) {
        console.log(chalk.yellow('\n📭 No transactions found.'));
        console.log(chalk.gray('Your transaction history will appear here.'));
        return;
      }

      console.log(chalk.blue.bold(`\n📋 Transaction History (Last ${limit})\n`));

      const tableData = [
        ['Type', 'Amount', 'From/To', 'Status', 'Date', 'Memo']
      ];

      transactions.forEach(tx => {
        const amount = tx.type === 'mint' ? 
          `+${formatAim(tx.microAmount, 2)}` : 
          tx.type === 'transfer' ? 
            `-${formatAim(tx.microAmount, 2)}` :
            formatAim(tx.microAmount, 2);
        
        const fromTo = tx.type === 'transfer' ? 
          `${tx.fromAccountId?.substring(0, 8)}... → ${tx.toAccountId?.substring(0, 8)}...` :
          tx.type === 'mint' ? 'System' :
          'N/A';

        tableData.push([
          tx.type.toUpperCase(),
          amount,
          fromTo,
          tx.status || 'completed',
          new Date(tx.createdAt).toLocaleDateString(),
          tx.memo || '-'
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

      // Show summary
      const mintCount = transactions.filter(tx => tx.type === 'mint').length;
      const transferCount = transactions.filter(tx => tx.type === 'transfer').length;
      const totalMinted = transactions
        .filter(tx => tx.type === 'mint')
        .reduce((sum, tx) => sum + parseFloat(tx.microAmount), 0);
      const totalTransferred = transactions
        .filter(tx => tx.type === 'transfer')
        .reduce((sum, tx) => sum + parseFloat(tx.microAmount), 0);

      console.log(chalk.blue('\n📊 Summary:'));
      console.log(chalk.white(`   Total Transactions: ${transactions.length}`));
      console.log(chalk.green(`   Minted: ${formatAim(totalMinted.toString(), 6)} AIM (${mintCount} txns)`));
      console.log(chalk.yellow(`   Transferred: ${formatAim(totalTransferred.toString(), 6)} AIM (${transferCount} txns)`));

    } catch (error: any) {
      spinner.fail('Failed to load history');
      console.error(chalk.red(`Error: ${error.message}`));
    }
  }
}
