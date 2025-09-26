import { Controller, Post, Get, Body, Param, BadRequestException } from '@nestjs/common';
import { UsageService, StartUsageRequest, TickUsageRequest, CloseUsageRequest } from './usage.service';

@Controller('v1/usage')
export class UsageController {
  constructor(
    private readonly usageService: UsageService,
  ) {}

  @Post('start')
  async startUsage(@Body() request: StartUsageRequest) {
    try {
      return await this.usageService.startUsage(request, 'mock-account-id');
    } catch (error) {
      throw new BadRequestException(`Failed to start usage: ${error.message}`);
    }
  }

  @Post('tick')
  async tickUsage(@Body() request: TickUsageRequest) {
    try {
      return await this.usageService.tickUsage(request);
    } catch (error) {
      throw new BadRequestException(`Failed to tick usage: ${error.message}`);
    }
  }

  @Post('close')
  async closeUsage(@Body() request: CloseUsageRequest) {
    try {
      return await this.usageService.closeUsage(request);
    } catch (error) {
      throw new BadRequestException(`Failed to close usage: ${error.message}`);
    }
  }

  @Get(':sessionId')
  async getUsageSession(@Param('sessionId') sessionId: string) {
    try {
      return await this.usageService.getUsageSession(sessionId);
    } catch (error) {
      throw new BadRequestException(`Failed to get usage session: ${error.message}`);
    }
  }

  @Get()
  async getUsageHistory() {
    try {
      return await this.usageService.getUsageHistory();
    } catch (error) {
      throw new BadRequestException(`Failed to get usage history: ${error.message}`);
    }
  }
}