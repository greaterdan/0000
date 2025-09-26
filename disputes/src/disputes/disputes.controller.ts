import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { DisputesService, CreateDisputeRequest } from './disputes.service';

@Controller('disputes')
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post()
  async createDispute(@Body() request: CreateDisputeRequest) {
    return await this.disputesService.createDispute(request);
  }

  @Get(':disputeId')
  async getDispute(@Param('disputeId') disputeId: string) {
    return await this.disputesService.getDispute(disputeId);
  }

  @Get()
  async listDisputes(
    @Query('accountId') accountId?: string,
    @Query('status') status?: string
  ) {
    return await this.disputesService.listDisputes(accountId, status);
  }
}
