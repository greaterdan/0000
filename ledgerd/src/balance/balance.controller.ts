import { Controller, Post, Get, Body, Param, BadRequestException } from '@nestjs/common';
import { BalanceService, TransferRequest, MintRequest } from './balance.service';

@Controller('internal/balances')
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Get(':accountId')
  async getBalance(@Param('accountId') accountId: string) {
    return this.balanceService.getBalance(accountId);
  }

  @Post('transfer')
  async transfer(@Body() request: TransferRequest) {
    try {
      return await this.balanceService.transfer(request);
    } catch (error) {
      throw new BadRequestException(`Transfer failed: ${error.message}`);
    }
  }

  @Post('mint')
  async mint(@Body() request: MintRequest) {
    try {
      return await this.balanceService.mint(request);
    } catch (error) {
      throw new BadRequestException(`Mint failed: ${error.message}`);
    }
  }

  @Post('adjust')
  async adjustBalance(
    @Body('accountId') accountId: string,
    @Body('microAmount') microAmount: string,
    @Body('reason') reason: string,
  ) {
    try {
      return await this.balanceService.adjustBalance(accountId, microAmount, reason);
    } catch (error) {
      throw new BadRequestException(`Balance adjustment failed: ${error.message}`);
    }
  }
}
