import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class RatesService {
  constructor(private readonly httpService: HttpService) {}

  async getRates() {
    const treasuryUrl = process.env.TREASURY_URL || 'http://localhost:3004';
    
    const response = await firstValueFrom(
      this.httpService.get(`${treasuryUrl}/treasury/rates`)
    );
    
    return response.data;
  }
}
