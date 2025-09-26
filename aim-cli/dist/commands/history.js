"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryManager = void 0;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const table_1 = require("table");
const config_1 = require("./config");
const api_client_1 = require("../utils/api-client");
const aim_utils_1 = require("../utils/aim-utils");
class HistoryManager {
    constructor() {
        this.config = new config_1.ConfigManager();
        this.api = new api_client_1.ApiClient();
    }
    async showHistory(limit = 10) {
        const accountId = await this.config.getConfig('accountId');
        if (!accountId) {
            console.log(chalk_1.default.red('No account found. Create one with: aim account --create'));
            return;
        }
        const spinner = (0, ora_1.default)('Loading transaction history...').start();
        try {
            const transactions = await this.api.getTransactionHistory(accountId, limit);
            spinner.succeed('History loaded');
            if (transactions.length === 0) {
                console.log(chalk_1.default.yellow('\n📭 No transactions found.'));
                console.log(chalk_1.default.gray('Your transaction history will appear here.'));
                return;
            }
            console.log(chalk_1.default.blue.bold(`\n📋 Transaction History (Last ${limit})\n`));
            const tableData = [
                ['Type', 'Amount', 'From/To', 'Status', 'Date', 'Memo']
            ];
            transactions.forEach(tx => {
                const amount = tx.type === 'mint' ?
                    `+${(0, aim_utils_1.formatAim)(tx.microAmount, 2)}` :
                    tx.type === 'transfer' ?
                        `-${(0, aim_utils_1.formatAim)(tx.microAmount, 2)}` :
                        (0, aim_utils_1.formatAim)(tx.microAmount, 2);
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
            // Show summary
            const mintCount = transactions.filter(tx => tx.type === 'mint').length;
            const transferCount = transactions.filter(tx => tx.type === 'transfer').length;
            const totalMinted = transactions
                .filter(tx => tx.type === 'mint')
                .reduce((sum, tx) => sum + parseFloat(tx.microAmount), 0);
            const totalTransferred = transactions
                .filter(tx => tx.type === 'transfer')
                .reduce((sum, tx) => sum + parseFloat(tx.microAmount), 0);
            console.log(chalk_1.default.blue('\n📊 Summary:'));
            console.log(chalk_1.default.white(`   Total Transactions: ${transactions.length}`));
            console.log(chalk_1.default.green(`   Minted: ${(0, aim_utils_1.formatAim)(totalMinted.toString(), 6)} AIM (${mintCount} txns)`));
            console.log(chalk_1.default.yellow(`   Transferred: ${(0, aim_utils_1.formatAim)(totalTransferred.toString(), 6)} AIM (${transferCount} txns)`));
        }
        catch (error) {
            spinner.fail('Failed to load history');
            console.error(chalk_1.default.red(`Error: ${error.message}`));
        }
    }
}
exports.HistoryManager = HistoryManager;
//# sourceMappingURL=history.js.map