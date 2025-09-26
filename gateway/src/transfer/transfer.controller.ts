import { Controller, Post, Body, UseGuards, Request, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiQuery, ApiParam } from '@nestjs/swagger';
import { TransferService } from './transfer.service';
import { ServiceTokenGuard, RequireScopes } from '../auth/service-token.guard';
import { 
  TransferRequestDto, 
  TransferResponseDto, 
  TransferHistoryRequestDto, 
  TransferHistoryResponseDto,
  TransferStatsDto,
  TransferStatsResponseDto
} from './dto/transfer.dto';

@ApiTags('Transfers')
@Controller('v1/transfer')
@UseGuards(ServiceTokenGuard)
@ApiBearerAuth('JWT-auth')
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  @Post()
  @RequireScopes(['spend'])
  @ApiOperation({
    summary: 'Transfer AIM tokens',
    description: 'Transfer AIM tokens from the authenticated account to another account'
  })
  @ApiBody({ type: TransferRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Transfer completed successfully',
    type: TransferResponseDto
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid transfer parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions or balance' })
  async transfer(@Body() request: TransferRequestDto, @Request() req): Promise<TransferResponseDto> {
    const fromAccountId = req.user.account_id;
    return await this.transferService.transfer(request, fromAccountId);
  }

  @Get('history')
  @RequireScopes(['view'])
  @ApiOperation({
    summary: 'Get transfer history',
    description: 'Get transfer history for the authenticated account with optional filtering'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (1-based)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'] })
  @ApiQuery({ name: 'type', required: false, enum: ['standard', 'priority', 'bulk'] })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Filter by date range start' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Filter by date range end' })
  @ApiResponse({
    status: 200,
    description: 'Transfer history retrieved successfully',
    type: TransferHistoryResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getTransferHistory(@Query() query: TransferHistoryRequestDto, @Request() req): Promise<TransferHistoryResponseDto> {
    const accountId = req.user.account_id;
    return await this.transferService.getTransferHistory(accountId, query);
  }

  @Get('stats')
  @RequireScopes(['view'])
  @ApiOperation({
    summary: 'Get transfer statistics',
    description: 'Get transfer statistics for the authenticated account'
  })
  @ApiResponse({
    status: 200,
    description: 'Transfer statistics retrieved successfully',
    type: TransferStatsResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getTransferStats(@Request() req): Promise<TransferStatsResponseDto> {
    const accountId = req.user.account_id;
    return await this.transferService.getTransferStats(accountId);
  }

  @Get(':transactionId')
  @RequireScopes(['view'])
  @ApiOperation({
    summary: 'Get transfer details',
    description: 'Get detailed information about a specific transfer'
  })
  @ApiParam({ name: 'transactionId', description: 'Transfer transaction ID' })
  @ApiResponse({
    status: 200,
    description: 'Transfer details retrieved successfully',
    type: TransferResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Transfer not found' })
  async getTransfer(@Param('transactionId') transactionId: string, @Request() req): Promise<TransferResponseDto> {
    const accountId = req.user.account_id;
    return await this.transferService.getTransfer(transactionId, accountId);
  }
}
