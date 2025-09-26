import { Controller, Post, Get, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { JournalService, AppendEntryRequest } from './journal.service';
import { JournalType } from '../shared';

@Controller('internal')
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Post('append')
  async appendEntry(@Body() request: AppendEntryRequest) {
    try {
      return await this.journalService.appendEntry(request);
    } catch (error) {
      throw new BadRequestException(`Failed to append entry: ${error.message}`);
    }
  }

  @Get('journal/latest')
  async getLatestEntry() {
    return this.journalService.getLatestEntry();
  }

  @Get('journal/type/:type')
  async getEntriesByType(
    @Param('type') type: JournalType,
    @Query('limit') limit?: number,
  ) {
    return this.journalService.getEntriesByType(type, limit || 100);
  }

  @Get('journal/account/:accountId')
  async getEntriesByAccount(
    @Param('accountId') accountId: string,
    @Query('limit') limit?: number,
  ) {
    return this.journalService.getEntriesByAccount(accountId, limit || 100);
  }

  @Get('journal/:id')
  async getEntryById(@Param('id') id: string) {
    return this.journalService.getEntryById(id);
  }

  @Get('journal/period')
  async getEntriesInPeriod(
    @Query('start') startDate: string,
    @Query('end') endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date format');
    }
    
    return this.journalService.getEntriesInPeriod(start, end);
  }
}
