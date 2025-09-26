import { Controller, Get, Post, Body, Query, BadRequestException } from '@nestjs/common';
import { TreasuryService } from './treasury.service';

export interface SaleRequest {
  amountAim: number;
  usdAmount: number;
  paymentMethod: 'crypto' | 'fiat';
  paymentDetails: any;
}

export interface SellRequest {
  accountId: string;
  microAmount: string;
  usdValue: number;
  payoutCrypto: string;
}

@Controller('treasury')
export class TreasuryController {
  constructor(private readonly treasuryService: TreasuryService) {}

  @Get('rates')
  async getRates() {
    return await this.treasuryService.getRates();
  }

  @Get('status')
  async getStatus() {
    return await this.treasuryService.getSupplyInfo();
  }

  @Post('sale')
  async executeSale(@Body() request: SaleRequest) {
    try {
      const result = await this.treasuryService.executeSale(
        'mock-account-id',
        request.amountAim.toString(),
        request.usdAmount
      );
      
      return result;
    } catch (error) {
      throw new BadRequestException(`Sale failed: ${error.message}`);
    }
  }

  @Get('supply')
  async getSupplyInfo() {
    const status = await this.treasuryService.getSupplyInfo();
    const saleStats = await this.treasuryService.getSaleStats();
    
    return {
      totalSupply: status.totalSupply,
      publicSaleAllocation: status.publicSaleAllocation,
      treasuryReserves: status.treasuryReserves,
      currentPrice: status.currentPrice,
      saleStats: saleStats
    };
  }

  @Get('sale-stats')
  async getSaleStats() {
    return await this.treasuryService.getSaleStats();
  }

  @Get('price-history')
  async getPriceHistory(@Query('days') days?: string) {
    return await this.treasuryService.getPriceHistory(days ? parseInt(days) : 30);
  }

  @Post('sell')
  async executeSell(@Body() request: SellRequest) {
    try {
      const result = await this.treasuryService.executeSell(
        request.accountId,
        request.microAmount,
        request.usdValue,
        request.payoutCrypto
      );
      
      return {
        id: result.id,
        accountId: request.accountId,
        aimAmount: request.microAmount,
        usdValue: request.usdValue,
        payoutCrypto: request.payoutCrypto,
        status: result.status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new BadRequestException(`Sell failed: ${error.message}`);
    }
  }

  @Get('sell-orders')
  async getSellOrders(@Query('accountId') accountId?: string) {
    if (!accountId) {
      throw new BadRequestException('Account ID is required');
    }
    return await this.treasuryService.getSellOrders(accountId);
  }

  @Get('sell-orders/:orderId')
  async getSellOrder(@Query('orderId') orderId: string) {
    return await this.treasuryService.getSellOrder(orderId);
  }
}
