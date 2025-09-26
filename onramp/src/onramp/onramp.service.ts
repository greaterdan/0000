import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

export interface CreateIntentRequest {
  crypto: 'BTC' | 'ETH' | 'SOL' | 'XMR';
  amount: string;
  accountId: string;
  memo?: string;
}

export interface IntentResponse {
  intentId: string;
  depositAddress: string;
  crypto: string;
  amount: string;
  aimAmount: string;
  status: 'pending' | 'confirmed' | 'completed' | 'expired';
  expiresAt: Date;
  createdAt: Date;
}

@Injectable()
export class OnrampService {
  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  async createIntent(request: CreateIntentRequest): Promise<IntentResponse> {
    // Generate unique deposit address
    const depositAddress = await this.generateDepositAddress(request.crypto);
    
    // Calculate AIM amount based on current rates
    const aimAmount = await this.calculateAimAmount(request.crypto, request.amount);
    
    // Create intent record
    const intent = await this.prisma.onrampIntent.create({
      data: {
        id: uuidv4(),
        accountId: request.accountId,
        crypto: request.crypto,
        amount: request.amount,
        aimAmount,
        depositAddress,
        memo: request.memo,
        status: 'pending',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        createdAt: new Date(),
      },
    });

    return {
      intentId: intent.id,
      depositAddress: intent.depositAddress,
      crypto: intent.crypto,
      amount: intent.amount,
      aimAmount: intent.aimAmount,
      status: intent.status as any,
      expiresAt: intent.expiresAt,
      createdAt: intent.createdAt,
    };
  }

  private async generateDepositAddress(cryptoType: string): Promise<string> {
    // In production, this would integrate with actual wallet services
    // For demo purposes, generate deterministic addresses
    const timestamp = Date.now().toString();
    const hash = crypto.createHash('sha256').update(timestamp + cryptoType).digest('hex');
    
    switch (cryptoType) {
      case 'BTC':
        return `1${hash.substring(0, 33)}`; // Bitcoin address format
      case 'ETH':
        return `0x${hash.substring(0, 40)}`; // Ethereum address format
      case 'SOL':
        return `${hash.substring(0, 44)}`; // Solana address format
      case 'XMR':
        return `4${hash.substring(0, 94)}`; // Monero address format
      default:
        throw new BadRequestException(`Unsupported crypto: ${crypto}`);
    }
  }

  private async calculateAimAmount(crypto: string, amount: string): Promise<string> {
    // Get current rates from treasury
    const treasuryUrl = process.env.TREASURY_URL || 'http://localhost:3004';
    
    try {
      const ratesResponse = await firstValueFrom(
        this.httpService.get(`${treasuryUrl}/rates`)
      );
      
      const rates = ratesResponse.data;
      const usdPerAim = parseFloat(rates.usdBid); // Use bid price
      
      // Get real crypto to USD rates from CoinGecko
      const cryptoIds = {
        'BTC': 'bitcoin',
        'ETH': 'ethereum', 
        'SOL': 'solana',
        'XMR': 'monero'
      };
      
      const cryptoId = cryptoIds[crypto];
      if (!cryptoId) {
        throw new BadRequestException(`Unsupported crypto: ${crypto}`);
      }
      
      const priceResponse = await firstValueFrom(
        this.httpService.get(`https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=usd`)
      );
      
      const cryptoToUsd = priceResponse.data[cryptoId].usd;
      
      const usdAmount = parseFloat(amount) * cryptoToUsd;
      const aimAmount = usdAmount / usdPerAim;
      
      // Convert to microAIM (multiply by 1,000,000)
      return Math.floor(aimAmount * 1000000).toString();
    } catch (error) {
      throw new BadRequestException(`Failed to calculate AIM amount: ${error.message}`);
    }
  }

  async confirmDeposit(intentId: string, txHash: string, confirmations: number): Promise<IntentResponse> {
    const intent = await this.prisma.onrampIntent.findUnique({
      where: { id: intentId },
    });

    if (!intent) {
      throw new NotFoundException(`Intent ${intentId} not found`);
    }

    if (intent.status !== 'pending') {
      throw new BadRequestException('Intent is not pending');
    }

    if (intent.expiresAt < new Date()) {
      throw new BadRequestException('Intent has expired');
    }

    // Update intent with transaction details
    await this.prisma.onrampIntent.update({
      where: { id: intentId },
      data: {
        txHash,
        confirmations,
        status: 'confirmed',
        confirmedAt: new Date(),
      },
    });

    // Check if we have enough confirmations
    const requiredConfirmations = this.getRequiredConfirmations(intent.crypto);
    if (confirmations >= requiredConfirmations) {
      await this.completeIntent(intentId);
    }

    return this.getIntent(intentId);
  }

  private getRequiredConfirmations(crypto: string): number {
    const confirmationRequirements = {
      'BTC': 3,
      'ETH': 12,
      'SOL': 1,
      'XMR': 10,
    };
    return confirmationRequirements[crypto] || 3;
  }

  private async completeIntent(intentId: string) {
    const intent = await this.prisma.onrampIntent.findUnique({
      where: { id: intentId },
    });

    if (!intent) return;

    // Credit AIM to the account from treasury
    await this.creditAimFromTreasury(intent.accountId, intent.aimAmount, intent.txHash);

    // Update intent status
    await this.prisma.onrampIntent.update({
      where: { id: intentId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });
  }

  private async creditAimFromTreasury(accountId: string, aimAmount: string, txHash: string) {
    const ledgerdUrl = process.env.LEDGERD_URL || 'http://localhost:3001';
    
    // Transfer AIM from treasury to the account
    await firstValueFrom(
      this.httpService.post(`${ledgerdUrl}/internal/transfer`, {
        from: '00000000-0000-0000-0000-000000000001', // Treasury account ID
        to: accountId,
        microAmount: aimAmount,
        memo: `On-ramp credit for tx ${txHash}`,
      })
    );
  }

  async getIntent(intentId: string): Promise<IntentResponse> {
    const intent = await this.prisma.onrampIntent.findUnique({
      where: { id: intentId },
    });

    if (!intent) {
      throw new NotFoundException(`Intent ${intentId} not found`);
    }

    return {
      intentId: intent.id,
      depositAddress: intent.depositAddress,
      crypto: intent.crypto,
      amount: intent.amount,
      aimAmount: intent.aimAmount,
      status: intent.status as any,
      expiresAt: intent.expiresAt,
      createdAt: intent.createdAt,
    };
  }

  async listIntents(accountId?: string, status?: string) {
    const intents = await this.prisma.onrampIntent.findMany({
      where: {
        ...(accountId && { accountId }),
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return intents.map(intent => ({
      intentId: intent.id,
      depositAddress: intent.depositAddress,
      crypto: intent.crypto,
      amount: intent.amount,
      aimAmount: intent.aimAmount,
      status: intent.status,
      createdAt: intent.createdAt,
      expiresAt: intent.expiresAt,
    }));
  }

  // Mock function to simulate deposit detection (in production, this would be a webhook)
  async simulateDeposit(intentId: string, txHash: string) {
    // Simulate confirmations over time
    for (let i = 1; i <= 3; i++) {
      setTimeout(async () => {
        try {
          await this.confirmDeposit(intentId, txHash, i);
          console.log(`Intent ${intentId} confirmed with ${i} confirmations`);
        } catch (error) {
          console.error(`Error confirming intent ${intentId}:`, error.message);
        }
      }, i * 5000); // 5 seconds between confirmations
    }
  }
}
