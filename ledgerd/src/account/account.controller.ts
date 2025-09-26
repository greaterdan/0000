import { Controller, Post, Get, Put, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { AccountService, CreateAccountRequest } from './account.service';
import { AccountKind, AccountStatus } from '@prisma/client';

@Controller('internal/accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post()
  async createAccount(@Body() request: CreateAccountRequest) {
    try {
      return await this.accountService.createAccount(request);
    } catch (error) {
      throw new BadRequestException(`Failed to create account: ${error.message}`);
    }
  }

  @Get(':id')
  async getAccount(@Param('id') id: string) {
    return this.accountService.getAccount(id);
  }

  @Put(':id/status')
  async updateAccountStatus(
    @Param('id') id: string,
    @Body('status') status: AccountStatus,
  ) {
    return this.accountService.updateAccountStatus(id, status);
  }

  @Put(':id/reputation')
  async updateReputationScore(
    @Param('id') id: string,
    @Body('score') score: number,
  ) {
    return this.accountService.updateReputationScore(id, score);
  }

  @Get()
  async listAccounts(
    @Query('kind') kind?: AccountKind,
    @Query('limit') limit?: number,
  ) {
    return this.accountService.listAccounts(kind, limit || 100);
  }

  @Get('by-name/:displayName')
  async getAccountByDisplayName(@Param('displayName') displayName: string) {
    return this.accountService.getAccountByDisplayName(displayName);
  }
}
