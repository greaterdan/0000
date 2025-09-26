import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class LogService {
  constructor(private readonly httpService: HttpService) {}

  async getLatestCheckpoint() {
    const logdUrl = process.env.LOGD_URL || 'http://localhost:3002';
    
    const response = await firstValueFrom(
      this.httpService.get(`${logdUrl}/v1/log/latest`)
    );
    
    return response.data;
  }

  async getProof(txId: string) {
    const logdUrl = process.env.LOGD_URL || 'http://localhost:3002';
    
    const response = await firstValueFrom(
      this.httpService.get(`${logdUrl}/v1/log/proof?tx_id=${txId}`)
    );
    
    return response.data;
  }

  async getConsistencyProof(oldCheckpoint: string, newCheckpoint: string) {
    const logdUrl = process.env.LOGD_URL || 'http://localhost:3002';
    
    const response = await firstValueFrom(
      this.httpService.get(`${logdUrl}/v1/log/consistency?old=${oldCheckpoint}&new=${newCheckpoint}`)
    );
    
    return response.data;
  }
}
