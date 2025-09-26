import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsNumber, Min, Max } from 'class-validator';
import { BaseResponseDto } from '../../common/dto/base.dto';

export class BalanceDto {
  @ApiProperty({
    description: 'Account ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  accountId: string;

  @ApiProperty({
    description: 'Account balance in microAIM',
    example: '1000000000'
  })
  @IsString()
  microAmount: string;

  @ApiProperty({
    description: 'Account balance in AIM (human readable)',
    example: '1000.000000'
  })
  @IsString()
  amount: string;

  @ApiProperty({
    description: 'Balance last updated timestamp',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsString()
  updatedAt: string;

  @ApiProperty({
    description: 'Account display name',
    example: 'John Doe'
  })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiProperty({
    description: 'Account type',
    example: 'human',
    enum: ['human', 'agent', 'treasury']
  })
  @IsOptional()
  @IsString()
  accountKind?: string;
}

export class GetBalanceRequestDto {
  @ApiProperty({
    description: 'Account ID to get balance for',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false
  })
  @IsOptional()
  @IsUUID(4, { message: 'Account ID must be a valid UUID' })
  accountId?: string;
}

export class GetBalanceResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'Account balance information'
  })
  balance: BalanceDto;
}

export class GetMultipleBalancesRequestDto {
  @ApiProperty({
    description: 'Array of account IDs to get balances for',
    example: ['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001'],
    type: [String],
    maxItems: 100
  })
  @IsNotEmpty({ message: 'Account IDs are required' })
  @IsUUID(4, { each: true, message: 'Each account ID must be a valid UUID' })
  accountIds: string[];
}

export class GetMultipleBalancesResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'Array of account balances',
    type: [BalanceDto]
  })
  balances: BalanceDto[];
}

export class BalanceHistoryDto {
  @ApiProperty({
    description: 'Account ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  accountId: string;

  @ApiProperty({
    description: 'Balance at this point in time',
    example: '1000000000'
  })
  @IsString()
  balance: string;

  @ApiProperty({
    description: 'Balance change amount',
    example: '1000000'
  })
  @IsString()
  change: string;

  @ApiProperty({
    description: 'Change type',
    example: 'credit',
    enum: ['credit', 'debit']
  })
  @IsString()
  changeType: string;

  @ApiProperty({
    description: 'Transaction ID that caused this change',
    example: 'tx_123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiProperty({
    description: 'Change description',
    example: 'Transfer from account 123e4567-e89b-12d3-a456-426614174001'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Change timestamp',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsString()
  timestamp: string;
}

export class GetBalanceHistoryRequestDto {
  @ApiProperty({
    description: 'Account ID to get history for',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID(4, { message: 'Account ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Account ID is required' })
  accountId: string;

  @ApiProperty({
    description: 'Page number (1-based)',
    example: 1,
    minimum: 1,
    default: 1
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20
  })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @ApiProperty({
    description: 'Filter by date range start',
    example: '2024-01-01T00:00:00.000Z',
    required: false
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({
    description: 'Filter by date range end',
    example: '2024-01-31T23:59:59.999Z',
    required: false
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty({
    description: 'Filter by change type',
    example: 'credit',
    enum: ['credit', 'debit'],
    required: false
  })
  @IsOptional()
  @IsString()
  changeType?: string;
}

export class GetBalanceHistoryResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'Array of balance history entries',
    type: [BalanceHistoryDto]
  })
  history: BalanceHistoryDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: {
      page: 1,
      limit: 20,
      total: 100,
      totalPages: 5,
      hasNext: true,
      hasPrev: false
    }
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class BalanceStatsDto {
  @ApiProperty({
    description: 'Total number of accounts',
    example: 1000
  })
  @IsNumber()
  totalAccounts: number;

  @ApiProperty({
    description: 'Total supply in microAIM',
    example: '1000000000000000'
  })
  @IsString()
  totalSupply: string;

  @ApiProperty({
    description: 'Total supply in AIM (human readable)',
    example: '1000000.000000'
  })
  @IsString()
  totalSupplyFormatted: string;

  @ApiProperty({
    description: 'Number of accounts with zero balance',
    example: 50
  })
  @IsNumber()
  zeroBalanceAccounts: number;

  @ApiProperty({
    description: 'Average balance in microAIM',
    example: '1000000000'
  })
  @IsString()
  averageBalance: string;

  @ApiProperty({
    description: 'Average balance in AIM (human readable)',
    example: '1000.000000'
  })
  @IsString()
  averageBalanceFormatted: string;

  @ApiProperty({
    description: 'Top 10 accounts by balance',
    type: [BalanceDto]
  })
  topAccounts: BalanceDto[];

  @ApiProperty({
    description: 'Balance distribution by account type',
    example: {
      human: '500000000000000',
      agent: '300000000000000',
      treasury: '200000000000000'
    }
  })
  distributionByType: Record<string, string>;
}

export class GetBalanceStatsResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'Balance statistics'
  })
  stats: BalanceStatsDto;
}

export class ReserveBalanceRequestDto {
  @ApiProperty({
    description: 'Account ID to reserve balance for',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID(4, { message: 'Account ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Account ID is required' })
  accountId: string;

  @ApiProperty({
    description: 'Amount to reserve in microAIM',
    example: '1000000'
  })
  @IsString({ message: 'Amount must be a string' })
  @IsNotEmpty({ message: 'Amount is required' })
  microAmount: string;

  @ApiProperty({
    description: 'Reservation reason',
    example: 'Pending transfer',
    maxLength: 255
  })
  @IsString({ message: 'Reason must be a string' })
  @IsNotEmpty({ message: 'Reason is required' })
  reason: string;

  @ApiProperty({
    description: 'Reservation expiration time in seconds',
    example: 300,
    minimum: 60,
    maximum: 3600
  })
  @IsNumber()
  @Min(60)
  @Max(3600)
  @IsOptional()
  expiresIn?: number = 300;
}

export class ReserveBalanceResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'Reservation ID',
    example: 'res_123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  reservationId: string;

  @ApiProperty({
    description: 'Reserved amount in microAIM',
    example: '1000000'
  })
  @IsString()
  reservedAmount: string;

  @ApiProperty({
    description: 'Reservation expiration timestamp',
    example: '2024-01-01T00:05:00.000Z'
  })
  @IsString()
  expiresAt: string;

  @ApiProperty({
    description: 'Remaining available balance in microAIM',
    example: '999000000'
  })
  @IsString()
  availableBalance: string;
}

export class ReleaseReservationRequestDto {
  @ApiProperty({
    description: 'Reservation ID to release',
    example: 'res_123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString({ message: 'Reservation ID must be a string' })
  @IsNotEmpty({ message: 'Reservation ID is required' })
  reservationId: string;
}

export class ReleaseReservationResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'Reservation release result',
    example: true
  })
  @IsString()
  released: string;

  @ApiProperty({
    description: 'Released amount in microAIM',
    example: '1000000'
  })
  @IsString()
  releasedAmount: string;

  @ApiProperty({
    description: 'New available balance in microAIM',
    example: '1000000000'
  })
  @IsString()
  availableBalance: string;
}
