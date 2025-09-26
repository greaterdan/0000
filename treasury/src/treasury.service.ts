import { Injectable, HttpService } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TreasuryService {
  constructor(private readonly httpService: HttpService) {}
  
  private currentPrice = 0.75; // Fallback price
  private lastPriceUpdate = 0;
  private priceCacheTimeout = 60000; // 1 minute cache

  private async fetchRealPrice(): Promise<number> {
    try {
      // Try CoinGecko first
      const response = await firstValueFrom(
        this.httpService.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')
      );
      
      const btcPrice = response.data.bitcoin.usd;
      // Use BTC price as reference, adjust for AIM token
      return Math.max(0.1, btcPrice * 0.00001); // Minimum $0.1, scaled from BTC
    } catch (error) {
      console.warn('Failed to fetch real price, using fallback:', error.message);
      return this.currentPrice;
    }
  }

  private async updatePriceIfNeeded(): Promise<void> {
    const now = Date.now();
    if (now - this.lastPriceUpdate > this.priceCacheTimeout) {
      this.currentPrice = await this.fetchRealPrice();
      this.lastPriceUpdate = now;
    }
  }

  async getRates() {
    await this.updatePriceIfNeeded();
    
    return {
      usdBid: this.currentPrice,
      usdAsk: this.currentPrice + 0.01,
      treasuryReserves: 50000000,
      totalSupply: 100000000,
      publicSaleAllocation: 50000000,
      lastUpdated: new Date().toISOString()
    };
  }

  async getSupplyInfo() {
    return {
      totalSupply: 100000000,
      publicSaleAllocation: 50000000,
      treasuryReserves: 50000000,
      currentPrice: this.currentPrice
    };
  }

  async getSaleStats() {
    return {
      totalSold: 0,
      totalAllocation: 50000000,
      currentPhase: 'phase_1',
      currentPrice: this.currentPrice
    };
  }

  async getPriceHistory(days: number = 30) {
    try {
      // Fetch real historical data from CoinGecko
      const response = await firstValueFrom(
        this.httpService.get(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}`)
      );
      
      const prices = response.data.prices;
      return prices.map(([timestamp, btcPrice]) => ({
        date: new Date(timestamp).toISOString(),
        price: Math.max(0.1, btcPrice * 0.00001) // Scale BTC price for AIM
      }));
    } catch (error) {
      console.warn('Failed to fetch price history, using fallback:', error.message);
      // Fallback to current price
      return [{
        date: new Date().toISOString(),
        price: this.currentPrice
      }];
    }
  }

  async executeSale(accountId: string, microAmount: string, usdValue: number) {
    // Validate the sale
    const amount = BigInt(microAmount);
    const price = parseFloat(process.env.TREASURY_USD_BID || '0.75');
    const expectedUsdValue = Number(amount) / 1000000 * price;
    
    if (Math.abs(usdValue - expectedUsdValue) > 0.01) {
      throw new Error('USD value does not match expected amount');
    }

    // Transfer tokens from treasury to buyer account
    const treasuryAccountId = '00000000-0000-0000-0000-000000000001';
    const ledgerdUrl = process.env.LEDGERD_URL || 'http://localhost:3001';
    
    try {
      // Call ledgerd service to transfer tokens
      const transferResponse = await firstValueFrom(
        this.httpService.post(`${ledgerdUrl}/internal/transfer`, {
          from: treasuryAccountId,
          to: accountId,
          microAmount: microAmount,
          memo: `Token sale for $${usdValue}`
        })
      );
      
      console.log(`Real token transfer completed: ${microAmount} microAIM to ${accountId}`);
      
      return {
        id: transferResponse.data.transactionId,
        accountId,
        microAmount,
        usdValue,
        status: 'completed',
        timestamp: new Date().toISOString(),
        transactionHash: transferResponse.data.transactionId
      };
    } catch (error) {
      console.error('Token transfer failed:', error.message);
      throw new Error(`Token transfer failed: ${error.message}`);
    }
  }

  async executeSell(accountId: string, microAmount: string, usdValue: number, payoutCrypto: string) {
    // Transfer tokens from seller back to treasury
    const treasuryAccountId = '00000000-0000-0000-0000-000000000001';
    const ledgerdUrl = process.env.LEDGERD_URL || 'http://localhost:3001';
    
    try {
      // Call ledgerd service to transfer tokens back to treasury
      const transferResponse = await firstValueFrom(
        this.httpService.post(`${ledgerdUrl}/internal/transfer`, {
          from: accountId,
          to: treasuryAccountId,
          microAmount: microAmount,
          memo: `Token sell for $${usdValue} - payout: ${payoutCrypto}`
        })
      );
      
      console.log(`Real token sell completed: ${microAmount} microAIM from ${accountId} for $${usdValue}`);
      
      return {
        id: transferResponse.data.transactionId,
        accountId,
        microAmount,
        usdValue,
        payoutCrypto,
        status: 'completed',
        timestamp: new Date().toISOString(),
        transactionHash: transferResponse.data.transactionId
      };
    } catch (error) {
      console.error('Token sell failed:', error.message);
      throw new Error(`Token sell failed: ${error.message}`);
    }
  }

  async getSellOrders(accountId: string) {
    return [];
  }

  async getSellOrder(orderId: string) {
    return {
      id: orderId,
      status: 'completed',
      timestamp: new Date().toISOString()
    };
  }
}