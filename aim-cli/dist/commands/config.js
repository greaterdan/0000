"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigManager = void 0;
const chalk_1 = __importDefault(require("chalk"));
const conf_1 = __importDefault(require("conf"));
class ConfigManager {
    constructor() {
        this.config = new conf_1.default({
            projectName: 'aim-cli',
            defaults: {
                apiUrl: 'http://localhost:3005',
                onrampUrl: 'http://localhost:3012',
                accountId: null,
                displayName: null,
                accountKind: null
            }
        });
    }
    async getConfig(key) {
        const value = this.config.get(key);
        return typeof value === 'string' ? value : null;
    }
    async setConfig(key, value) {
        this.config.set(key, value);
    }
    async listConfig() {
        const allConfig = this.config.store;
        console.log(chalk_1.default.blue.bold('\n⚙️  AIM CLI Configuration\n'));
        if (Object.keys(allConfig).length === 0) {
            console.log(chalk_1.default.yellow('No configuration found.'));
            return;
        }
        Object.entries(allConfig).forEach(([key, value]) => {
            if (key === 'accountId' && value) {
                console.log(chalk_1.default.white(`   ${key}: ${value}`));
            }
            else if (key === 'displayName' && value) {
                console.log(chalk_1.default.white(`   ${key}: ${value}`));
            }
            else if (key === 'accountKind' && value) {
                console.log(chalk_1.default.white(`   ${key}: ${value}`));
            }
            else {
                console.log(chalk_1.default.gray(`   ${key}: ${value}`));
            }
        });
        console.log(chalk_1.default.blue('\n💡 Configuration file location:'));
        console.log(chalk_1.default.gray(`   ~/.config/aim-cli/config.json`));
    }
    async getConfigValue(key) {
        const value = await this.getConfig(key);
        if (value === null) {
            console.log(chalk_1.default.yellow(`Configuration key '${key}' not found.`));
        }
        else {
            console.log(chalk_1.default.white(`${key}: ${value}`));
        }
    }
    async setConfigValue(key, value) {
        await this.setConfig(key, value);
        console.log(chalk_1.default.green(`✅ Set ${key} = ${value}`));
    }
}
exports.ConfigManager = ConfigManager;
//# sourceMappingURL=config.js.map