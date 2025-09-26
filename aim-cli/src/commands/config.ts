import chalk from 'chalk';
import Conf from 'conf';

export class ConfigManager {
  private config: Conf;

  constructor() {
    this.config = new Conf({
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

  async getConfig(key: string): Promise<string | null> {
    const value = this.config.get(key);
    return typeof value === 'string' ? value : null;
  }

  async setConfig(key: string, value: string): Promise<void> {
    this.config.set(key, value);
  }

  async listConfig(): Promise<void> {
    const allConfig = this.config.store;
    
    console.log(chalk.blue.bold('\n⚙️  AIM CLI Configuration\n'));
    
    if (Object.keys(allConfig).length === 0) {
      console.log(chalk.yellow('No configuration found.'));
      return;
    }

    Object.entries(allConfig).forEach(([key, value]) => {
      if (key === 'accountId' && value) {
        console.log(chalk.white(`   ${key}: ${value}`));
      } else if (key === 'displayName' && value) {
        console.log(chalk.white(`   ${key}: ${value}`));
      } else if (key === 'accountKind' && value) {
        console.log(chalk.white(`   ${key}: ${value}`));
      } else {
        console.log(chalk.gray(`   ${key}: ${value}`));
      }
    });

    console.log(chalk.blue('\n💡 Configuration file location:'));
    console.log(chalk.gray(`   ~/.config/aim-cli/config.json`));
  }

  async getConfigValue(key: string): Promise<void> {
    const value = await this.getConfig(key);
    
    if (value === null) {
      console.log(chalk.yellow(`Configuration key '${key}' not found.`));
    } else {
      console.log(chalk.white(`${key}: ${value}`));
    }
  }

  async setConfigValue(key: string, value: string): Promise<void> {
    await this.setConfig(key, value);
    console.log(chalk.green(`✅ Set ${key} = ${value}`));
  }
}
