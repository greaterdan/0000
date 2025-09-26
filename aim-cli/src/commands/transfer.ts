import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { ConfigManager } from './config';
import { ApiClient } from '../utils/api-client';
import { aimToMicroAim, formatAim } from '../utils/aim-utils';
import { SeedManager } from '../utils/seed-manager';

export class TransferManager {
  private config: ConfigManager;
  private api: ApiClient;

  constructor() {
    this.config = new ConfigManager();
    this.api = new ApiClient();
  }

  async sendTokens(toAccountId?: string, amount?: string, memo?: string): Promise<void> {
    const fromAccountId = await this.config.getConfig('accountId');
    
    if (!fromAccountId) {
      console.log(chalk.red('No account found. Create one with: aim account --create'));
      return;
    }

    console.log(chalk.blue.bold('\n💸 Send AIM Tokens\n'));

    // Get recipient account ID
    let recipientId = toAccountId;
    if (!recipientId) {
      const recipientAnswer = await inquirer.prompt([
        {
          type: 'input',
          name: 'toAccountId',
          message: 'Recipient account ID:',
          validate: (input: string) => {
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
      const amountAnswer = await inquirer.prompt([
        {
          type: 'input',
          name: 'amount',
          message: 'Amount to send (in AIM):',
          validate: (input: string) => {
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
      const memoAnswer = await inquirer.prompt([
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
    const spinner = ora('Checking balance...').start();
    try {
      const balance = await this.api.getBalance(fromAccountId);
      const currentBalance = parseFloat(balance.microAmount) / 1000000;
      const sendAmount = parseFloat(transferAmount);

      if (sendAmount > currentBalance) {
        spinner.fail('Insufficient balance');
        console.log(chalk.red(`\n❌ Insufficient balance!`));
        console.log(chalk.white(`   Current: ${formatAim(balance.microAmount, 6)} AIM`));
        console.log(chalk.white(`   Trying to send: ${transferAmount} AIM`));
        console.log(chalk.yellow('\n💡 Buy more AIM: aim buy --crypto BTC'));
        return;
      }

      spinner.succeed('Balance verified');

      // Confirm transaction
      console.log(chalk.blue('\n📋 Transaction Summary:'));
      console.log(chalk.white(`   From: ${fromAccountId}`));
      console.log(chalk.white(`   To: ${recipientId}`));
      console.log(chalk.white(`   Amount: ${transferAmount} AIM`));
      if (transferMemo) {
        console.log(chalk.white(`   Memo: ${transferMemo}`));
      }
      console.log(chalk.white(`   Fee: 0 AIM (no fees)`));

      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Confirm this transaction?',
          default: false
        }
      ]);

      if (!confirm) {
        console.log(chalk.yellow('Transaction cancelled.'));
        return;
      }

      // Send transaction with quantum-safe signature
      const sendSpinner = ora('Signing and sending transaction...').start();
      
      const microAmount = aimToMicroAim(parseFloat(transferAmount));
      
      // Create transaction data for signing
      const transactionData = {
        from: fromAccountId,
        to: recipientId,
        microAmount: microAmount.toString(),
        memo: transferMemo,
        timestamp: Date.now(),
        nonce: SeedManager.generateNonce()
      };
      
      // Get private key for signing
      const encryptedSeed = await this.config.getConfig('encryptedSeed');
      const seedIV = await this.config.getConfig('seedIV');
      const seedAuthTag = await this.config.getConfig('seedAuthTag');
      
      if (!encryptedSeed || !seedIV || !seedAuthTag) {
        sendSpinner.fail('No wallet found');
        console.log(chalk.red('Please create or restore a wallet first'));
        return;
      }
      
      // Prompt for password to decrypt seed
      const { password } = await inquirer.prompt([
        {
          type: 'password',
          name: 'password',
          message: 'Enter wallet password to sign transaction:',
          mask: '*'
        }
      ]);
      
      // Decrypt seed phrase
      const seedPhrase = SeedManager.decryptSeedPhraseQuantum(encryptedSeed, password, seedIV, seedAuthTag);
      
      // Generate quantum-safe key pair
      const { privateKey } = SeedManager.deriveQuantumKeyPair(seedPhrase);
      
      // Create transaction hash and sign it
      const transactionHash = SeedManager.createTransactionHash(transactionData);
      const signature = SeedManager.signMessageQuantum(transactionHash, privateKey);
      
      // Send signed transaction
      const signedTransaction = {
        ...transactionData,
        signature: signature.toString('hex'),
        cryptoType: 'quantum-safe'
      };
      
      const response = await this.api.transferSigned(signedTransaction);
      
      sendSpinner.succeed('Quantum-safe transaction sent successfully!');

      console.log(chalk.green('\n✅ Transaction Details:'));
      console.log(chalk.white(`   Transaction ID: ${response.id}`));
      console.log(chalk.white(`   Amount: ${transferAmount} AIM`));
      console.log(chalk.white(`   Status: ${response.status}`));
      console.log(chalk.white(`   Timestamp: ${new Date(response.createdAt).toLocaleString()}`));

      console.log(chalk.blue('\n💡 Next steps:'));
      console.log(chalk.gray('   aim balance          Check your updated balance'));
      console.log(chalk.gray('   aim history          View transaction history'));

    } catch (error: any) {
      spinner.fail('Transfer failed');
      console.error(chalk.red(`Error: ${error.message}`));
    }
  }
}
