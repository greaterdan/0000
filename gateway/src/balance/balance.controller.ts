import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { BalanceService } from './balance.service';
import { ServiceTokenGuard } from '../auth/service-token.guard';

@Controller('v1/balance')
@UseGuards(ServiceTokenGuard)
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Get()
  async getBalance(@Request() req) {
    const accountId = req.user.account_id;
    return await this.balanceService.getBalance(accountId);
  }
}
