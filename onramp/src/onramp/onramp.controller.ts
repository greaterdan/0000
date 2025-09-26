import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { OnrampService, CreateIntentRequest } from './onramp.service';

@Controller('onramp')
export class OnrampController {
  constructor(private readonly onrampService: OnrampService) {}

  @Post('intents')
  async createIntent(@Body() request: CreateIntentRequest) {
    return await this.onrampService.createIntent(request);
  }

  @Get('intents/:intentId')
  async getIntent(@Param('intentId') intentId: string) {
    return await this.onrampService.getIntent(intentId);
  }

  @Get('intents')
  async listIntents(
    @Query('accountId') accountId?: string,
    @Query('status') status?: string
  ) {
    return await this.onrampService.listIntents(accountId, status);
  }

  @Post('intents/:intentId/confirm')
  async confirmDeposit(
    @Param('intentId') intentId: string,
    @Body() body: { txHash: string; confirmations: number }
  ) {
    return await this.onrampService.confirmDeposit(intentId, body.txHash, body.confirmations);
  }

  @Post('intents/:intentId/simulate')
  async simulateDeposit(
    @Param('intentId') intentId: string,
    @Body() body: { txHash: string }
  ) {
    await this.onrampService.simulateDeposit(intentId, body.txHash);
    return { message: 'Deposit simulation started' };
  }
}
