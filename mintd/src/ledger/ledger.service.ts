import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { calculateMintAmount } from '../shared';

export interface MintRequest {
  accountId: string;
  microAmount: string;
  jobId?: string;
  reason?: string;
}

export interface MintResponse {
  transactionId: string;
  newBalance: string;
}

@Injectable()
export class LedgerService {
  private readonly ledgerUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.ledgerUrl = this.configService.get('LEDGERD_URL', 'http://ledgerd:3001');
  }

  async mint(request: MintRequest): Promise<MintResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.ledgerUrl}/internal/balances/mint`, {
          accountId: request.accountId,
          microAmount: request.microAmount,
          jobId: request.jobId,
          reason: request.reason,
        })
      );

      return {
        transactionId: response.data.transactionId,
        newBalance: response.data.newBalance,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to mint: ${error.message}`);
    }
  }

  async getBalance(accountId: string): Promise<{ microAmount: string }> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.ledgerUrl}/internal/balances/${accountId}`)
      );

      return {
        microAmount: response.data.microAmount,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get balance: ${error.message}`);
    }
  }

  calculateMintAmount(score: number, baseAmount: number = 100000, threshold: number = 0.85): string {
    return calculateMintAmount(score, baseAmount, threshold);
  }
}
