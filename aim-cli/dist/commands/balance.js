"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BalanceManager = void 0;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const config_1 = require("./config");
const api_client_1 = require("../utils/api-client");
const aim_utils_1 = require("../utils/aim-utils");
class BalanceManager {
    constructor() {
        this.config = new config_1.ConfigManager();
        this.api = new api_client_1.ApiClient();
    }
    async showBalance(accountId) {
        const targetAccountId = accountId || await this.config.getConfig('accountId');
        if (!targetAccountId) {
            console.log(chalk_1.default.red('No account ID provided. Create an account with: aim account --create'));
            return;
        }
        const spinner = (0, ora_1.default)('Loading balance...').start();
        try {
            const balance = await this.api.getBalance(targetAccountId);
            spinner.succeed('Balance loaded');
            const aimAmount = (0, aim_utils_1.microAimToAim)(balance.microAmount);
            const formattedAmount = (0, aim_utils_1.formatAim)(balance.microAmount, 6);
            console.log(chalk_1.default.blue.bold('\n💰 AIM Balance\n'));
            console.log(chalk_1.default.white(`   Account: ${targetAccountId}`));
            console.log(chalk_1.default.green.bold(`   Balance: ${formattedAmount} AIM`));
            console.log(chalk_1.default.gray(`   Raw: ${balance.microAmount} microAIM`));
            console.log(chalk_1.default.white(`   Updated: ${new Date(balance.updatedAt).toLocaleString()}`));
            // Show balance status
            if (aimAmount === 0) {
                console.log(chalk_1.default.yellow('\n💡 Your balance is empty. Buy some AIM:'));
                console.log(chalk_1.default.gray('   aim buy --crypto BTC --amount 0.01'));
            }
            else if (aimAmount < 1) {
                console.log(chalk_1.default.yellow('\n💡 Low balance. Consider buying more AIM:'));
                console.log(chalk_1.default.gray('   aim buy --crypto BTC --amount 0.01'));
            }
            else {
                console.log(chalk_1.default.green('\n✅ You have AIM tokens! You can:'));
                console.log(chalk_1.default.gray('   aim send --to <account-id> --amount 1'));
                console.log(chalk_1.default.gray('   aim history'));
            }
        }
        catch (error) {
            spinner.fail('Failed to load balance');
            console.error(chalk_1.default.red(`Error: ${error.message}`));
        }
    }
}
exports.BalanceManager = BalanceManager;
//# sourceMappingURL=balance.js.map