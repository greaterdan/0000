#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const account_1 = require("./commands/account");
const balance_1 = require("./commands/balance");
const transfer_1 = require("./commands/transfer");
const onramp_1 = require("./commands/onramp");
const sell_1 = require("./commands/sell");
const history_1 = require("./commands/history");
const config_1 = require("./commands/config");
const program = new commander_1.Command();
program
    .name('aim')
    .description('AIM Wallet - Simple & Secure AI Currency')
    .version('1.0.0');
// Simple setup command
program
    .command('setup')
    .description('Create your AIM wallet (first time setup)')
    .action(async () => {
    const accountManager = new account_1.AccountManager();
    await accountManager.createAccount();
});
// Simple restore command
program
    .command('restore')
    .description('Restore your wallet from backup')
    .action(async () => {
    const accountManager = new account_1.AccountManager();
    await accountManager.restoreAccount();
});
// Simple backup command
program
    .command('backup')
    .description('Export wallet backup')
    .action(async () => {
    const accountManager = new account_1.AccountManager();
    await accountManager.exportWallet();
});
// Account commands
program
    .command('account')
    .description('Manage your AIM account')
    .option('-c, --create', 'Create a new account')
    .option('-i, --info', 'Show account information')
    .option('-r, --restore', 'Restore account from seed phrase')
    .option('-e, --export', 'Export wallet backup')
    .option('--import', 'Import wallet backup')
    .action(async (options) => {
    const accountManager = new account_1.AccountManager();
    if (options.create) {
        await accountManager.createAccount();
    }
    else if (options.restore) {
        await accountManager.restoreAccount();
    }
    else if (options.export) {
        await accountManager.exportWallet();
    }
    else if (options.import) {
        await accountManager.importWallet();
    }
    else if (options.info) {
        await accountManager.showAccountInfo();
    }
    else {
        await accountManager.showAccountInfo();
    }
});
// Simple balance command
program
    .command('balance')
    .description('Check your AIM balance')
    .action(async () => {
    const balanceManager = new balance_1.BalanceManager();
    await balanceManager.showBalance();
});
// Simple send command
program
    .command('send')
    .description('Send AIM to someone')
    .action(async () => {
    const transferManager = new transfer_1.TransferManager();
    await transferManager.sendTokens();
});
program
    .command('receive')
    .description('Show your account address for receiving AIM')
    .action(async () => {
    const accountManager = new account_1.AccountManager();
    await accountManager.showReceiveAddress();
});
// Simple buy command
program
    .command('buy')
    .description('Buy AIM tokens')
    .action(async () => {
    const onrampManager = new onramp_1.OnrampManager();
    await onrampManager.createBuyIntent();
});
program
    .command('onramp')
    .description('Manage crypto on-ramp intents')
    .option('-l, --list', 'List all on-ramp intents')
    .option('-s, --status <intentId>', 'Check status of specific intent')
    .action(async (options) => {
    const onrampManager = new onramp_1.OnrampManager();
    if (options.list) {
        await onrampManager.listIntents();
    }
    else if (options.status) {
        await onrampManager.checkIntentStatus(options.status);
    }
    else {
        await onrampManager.listIntents();
    }
});
// Simple sell command
program
    .command('sell')
    .description('Sell AIM tokens')
    .action(async () => {
    const sellManager = new sell_1.SellManager();
    await sellManager.sellTokens();
});
// History commands
program
    .command('history')
    .description('View transaction history')
    .option('-l, --limit <number>', 'Number of transactions to show', '10')
    .action(async (options) => {
    const historyManager = new history_1.HistoryManager();
    await historyManager.showHistory(parseInt(options.limit));
});
// Config commands
program
    .command('config')
    .description('Configure CLI settings')
    .option('-s, --set <key=value>', 'Set configuration value')
    .option('-g, --get <key>', 'Get configuration value')
    .option('-l, --list', 'List all configuration')
    .action(async (options) => {
    const configManager = new config_1.ConfigManager();
    if (options.set) {
        const [key, value] = options.set.split('=');
        await configManager.setConfig(key, value);
    }
    else if (options.get) {
        await configManager.getConfig(options.get);
    }
    else if (options.list) {
        await configManager.listConfig();
    }
    else {
        await configManager.listConfig();
    }
});
// Global options
program
    .option('-v, --verbose', 'Enable verbose output')
    .option('--api-url <url>', 'API base URL', 'http://localhost:3005')
    .option('--onramp-url <url>', 'On-ramp API URL', 'http://localhost:3012');
// Error handling
program.on('command:*', () => {
    console.error(chalk_1.default.red('Invalid command: %s'), program.args.join(' '));
    console.log('See --help for a list of available commands.');
    process.exit(1);
});
// Show custom help if no command provided
if (!process.argv.slice(2).length) {
    console.log(chalk_1.default.blue.bold('\nAIM Wallet\n'));
    console.log(chalk_1.default.gray('AI Currency - Simple & Secure\n'));
    console.log(chalk_1.default.yellow('Quick Commands:'));
    console.log(chalk_1.default.white('  aim setup              Create your wallet'));
    console.log(chalk_1.default.white('  aim balance            Check your balance'));
    console.log(chalk_1.default.white('  aim buy                Buy AIM tokens'));
    console.log(chalk_1.default.white('  aim send               Send AIM to someone'));
    console.log(chalk_1.default.white('  aim sell               Sell AIM tokens\n'));
    console.log(chalk_1.default.cyan('Advanced Commands:'));
    console.log(chalk_1.default.white('  aim restore            Restore from backup'));
    console.log(chalk_1.default.white('  aim backup             Export wallet backup\n'));
    console.log(chalk_1.default.gray('Run "aim setup" to get started!\n'));
    // Exit to prevent showing commander help
    process.exit(0);
}
// Parse command line arguments
program.parse();
//# sourceMappingURL=index.js.map