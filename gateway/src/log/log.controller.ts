import { Controller, Get, Query } from '@nestjs/common';
import { LogService } from './log.service';

@Controller('v1/log')
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Get('latest')
  async getLatestCheckpoint() {
    return await this.logService.getLatestCheckpoint();
  }

  @Get('proof')
  async getProof(@Query('tx_id') txId: string) {
    return await this.logService.getProof(txId);
  }

  @Get('consistency')
  async getConsistencyProof(
    @Query('old') oldCheckpoint: string,
    @Query('new') newCheckpoint: string
  ) {
    return await this.logService.getConsistencyProof(oldCheckpoint, newCheckpoint);
  }
}
