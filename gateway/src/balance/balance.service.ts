import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class BalanceService {
  constructor(private readonly httpService: HttpService) {}

  async getBalance(accountId: string) {
    const ledgerdUrl = process.env.LEDGERD_URL || 'http://localhost:3001';
    
    const response = await firstValueFrom(
      this.httpService.get(`${ledgerdUrl}/internal/balance/${accountId}`)
    );
    
    return response.data;
  }
}
