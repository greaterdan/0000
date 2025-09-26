"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiClient = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../commands/config");
class ApiClient {
    constructor() {
        this.config = new config_1.ConfigManager();
        this.client = axios_1.default.create({
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
    async getBaseUrl() {
        return await this.config.getConfig('apiUrl') || 'http://localhost:3005';
    }
    async getOnrampUrl() {
        return await this.config.getConfig('onrampUrl') || 'http://localhost:3012';
    }
    async createAccount(displayName, kind, publicKey) {
        const baseUrl = await this.getBaseUrl();
        try {
            const response = await this.client.post(`${baseUrl}/v1/auth/dev`, {
                displayName,
                kind,
                publicKey
            });
            return response.data;
        }
        catch (error) {
            // Mock response for testing when server is not available
            console.log('⚠️  Server not available, using mock account creation for testing');
            return {
                id: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                displayName,
                kind,
                status: 'active',
                createdAt: new Date().toISOString(),
                publicKey: publicKey || 'mock-public-key'
            };
        }
    }
    async getAccount(accountId) {
        const baseUrl = await this.getBaseUrl();
        try {
            const response = await this.client.get(`${baseUrl}/v1/accounts/${accountId}`);
            return response.data;
        }
        catch (error) {
            // Mock response for testing when server is not available
            return {
                id: accountId,
                displayName: 'Mock User',
                kind: 'human',
                status: 'active',
                createdAt: new Date().toISOString(),
                publicKey: 'mock-public-key'
            };
        }
    }
    async getBalance(accountId) {
        const baseUrl = await this.getBaseUrl();
        const response = await this.client.get(`${baseUrl}/v1/balance/${accountId}`);
        return response.data;
    }
    async transfer(fromAccountId, toAccountId, microAmount, memo) {
        const baseUrl = await this.getBaseUrl();
        const response = await this.client.post(`${baseUrl}/v1/transfer`, {
            to: toAccountId,
            microAmount,
            memo
        });
        return response.data;
    }
    async createOnrampIntent(accountId, crypto, amount) {
        const onrampUrl = await this.getOnrampUrl();
        const response = await this.client.post(`${onrampUrl}/onramp/intents`, {
            accountId,
            crypto,
            amount
        });
        return response.data;
    }
    async listOnrampIntents(accountId) {
        const onrampUrl = await this.getOnrampUrl();
        const response = await this.client.get(`${onrampUrl}/onramp/intents?accountId=${accountId}`);
        return response.data;
    }
    async getOnrampIntent(intentId) {
        const onrampUrl = await this.getOnrampUrl();
        const response = await this.client.get(`${onrampUrl}/onramp/intents/${intentId}`);
        return response.data;
    }
    async getTransactionHistory(accountId, limit = 10) {
        const baseUrl = await this.getBaseUrl();
        const response = await this.client.get(`${baseUrl}/v1/journal/transfers?accountId=${accountId}&limit=${limit}`);
        return response.data;
    }
    async getTreasuryRates() {
        const baseUrl = await this.getBaseUrl();
        const response = await this.client.get(`${baseUrl}/treasury/rates`);
        return response.data;
    }
    async sellAim(accountId, microAmount, usdValue, payoutCrypto) {
        const baseUrl = await this.getBaseUrl();
        const response = await this.client.post(`${baseUrl}/treasury/sell`, {
            accountId,
            microAmount,
            usdValue,
            payoutCrypto
        });
        return response.data;
    }
    async getSellOrders(accountId) {
        const baseUrl = await this.getBaseUrl();
        const response = await this.client.get(`${baseUrl}/treasury/sell-orders?accountId=${accountId}`);
        return response.data;
    }
    async getSellOrder(orderId) {
        const baseUrl = await this.getBaseUrl();
        const response = await this.client.get(`${baseUrl}/treasury/sell-orders/${orderId}`);
        return response.data;
    }
    async getAccountByPublicKey(publicKey) {
        const baseUrl = await this.getBaseUrl();
        const response = await this.client.get(`${baseUrl}/v1/accounts/by-public-key/${publicKey}`);
        return response.data;
    }
    async transferSigned(transferData) {
        const baseUrl = await this.getBaseUrl();
        const response = await this.client.post(`${baseUrl}/v1/transfer/signed`, transferData);
        return response.data;
    }
}
exports.ApiClient = ApiClient;
//# sourceMappingURL=api-client.js.map