import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { IsString, IsNotEmpty, IsOptional, IsUUID, Matches, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferRequest {
  @ApiProperty({
    description: 'Recipient account ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid'
  })
  @IsUUID(4, { message: 'Recipient must be a valid UUID' })
  @IsNotEmpty({ message: 'Recipient is required' })
  to: string;

  @ApiProperty({
    description: 'Amount to transfer in microAIM (1 AIM = 1,000,000 microAIM)',
    example: '1000000',
    pattern: '^\\d+$'
  })
  @IsString({ message: 'Amount must be a string' })
  @IsNotEmpty({ message: 'Amount is required' })
  @Matches(/^\d+$/, { message: 'Amount must be a positive integer' })
  microAmount: string;

  @ApiProperty({
    description: 'Optional memo for the transfer',
    example: 'Payment for AI service',
    required: false,
    maxLength: 500
  })
  @IsOptional()
  @IsString({ message: 'Memo must be a string' })
  @MinLength(1, { message: 'Memo cannot be empty' })
  @MaxLength(500, { message: 'Memo cannot exceed 500 characters' })
  memo?: string;
}

@Injectable()
export class TransferService {
  constructor(private readonly httpService: HttpService) {}

  async transfer(request: TransferRequest, fromAccountId: string) {
    // Additional business logic validation
    const amount = BigInt(request.microAmount);
    
    // Check for reasonable transfer limits
    if (amount <= 0n) {
      throw new BadRequestException('Transfer amount must be positive');
    }
    
    if (amount > 1000000000000n) { // 1M AIM tokens max per transfer
      throw new BadRequestException('Transfer amount exceeds maximum limit');
    }
    
    // Prevent self-transfers
    if (request.to === fromAccountId) {
      throw new BadRequestException('Cannot transfer to yourself');
    }
    
    const ledgerdUrl = process.env.LEDGERD_URL || 'http://localhost:3001';
    
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${ledgerdUrl}/internal/transfer`, {
          from: fromAccountId,
          to: request.to,
          microAmount: request.microAmount,
          memo: request.memo,
        })
      );
      
      return response.data;
    } catch (error) {
      if (error.response?.status === 400) {
        throw new BadRequestException(error.response.data.message || 'Transfer failed');
      }
      throw error;
    }
  }
}
