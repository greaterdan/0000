import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, Matches, MinLength, MaxLength, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { BaseResponseDto } from '../../common/dto/base.dto';

export enum TransferStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum TransferType {
  STANDARD = 'standard',
  PRIORITY = 'priority',
  BULK = 'bulk'
}

export class TransferRequestDto {
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
    pattern: '^\\d+$',
    minimum: 1,
    maximum: 1000000000000
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

  @ApiProperty({
    description: 'Transfer type',
    example: 'standard',
    enum: TransferType,
    default: TransferType.STANDARD
  })
  @IsOptional()
  @IsEnum(TransferType, { message: 'Invalid transfer type' })
  type?: TransferType = TransferType.STANDARD;

  @ApiProperty({
    description: 'Optional reference ID for tracking',
    example: 'REF-123456',
    required: false,
    maxLength: 100
  })
  @IsOptional()
  @IsString({ message: 'Reference must be a string' })
  @MaxLength(100, { message: 'Reference cannot exceed 100 characters' })
  reference?: string;
}

export class TransferResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'Transfer transaction ID',
    example: 'tx_123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  transactionId: string;

  @ApiProperty({
    description: 'Transfer status',
    example: 'completed',
    enum: TransferStatus
  })
  @IsEnum(TransferStatus)
  status: TransferStatus;

  @ApiProperty({
    description: 'Transfer amount in microAIM',
    example: '1000000'
  })
  @IsString()
  amount: string;

  @ApiProperty({
    description: 'Sender account ID',
    example: '123e4567-e89b-12d3-a456-426614174001'
  })
  @IsString()
  from: string;

  @ApiProperty({
    description: 'Recipient account ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  to: string;

  @ApiProperty({
    description: 'Transfer memo',
    example: 'Payment for AI service'
  })
  @IsOptional()
  @IsString()
  memo?: string;

  @ApiProperty({
    description: 'Transfer type',
    example: 'standard',
    enum: TransferType
  })
  @IsEnum(TransferType)
  type: TransferType;

  @ApiProperty({
    description: 'Transfer reference ID',
    example: 'REF-123456'
  })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({
    description: 'Transfer timestamp',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsString()
  timestamp: string;

  @ApiProperty({
    description: 'Transaction fee in microAIM',
    example: '1000'
  })
  @IsString()
  fee: string;

  @ApiProperty({
    description: 'Block height (if applicable)',
    example: 12345
  })
  @IsOptional()
  @IsNumber()
  blockHeight?: number;
}

export class TransferHistoryDto {
  @ApiProperty({
    description: 'Transfer transaction ID',
    example: 'tx_123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  transactionId: string;

  @ApiProperty({
    description: 'Transfer status',
    example: 'completed',
    enum: TransferStatus
  })
  @IsEnum(TransferStatus)
  status: TransferStatus;

  @ApiProperty({
    description: 'Transfer amount in microAIM',
    example: '1000000'
  })
  @IsString()
  amount: string;

  @ApiProperty({
    description: 'Sender account ID',
    example: '123e4567-e89b-12d3-a456-426614174001'
  })
  @IsString()
  from: string;

  @ApiProperty({
    description: 'Recipient account ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  to: string;

  @ApiProperty({
    description: 'Transfer memo',
    example: 'Payment for AI service'
  })
  @IsOptional()
  @IsString()
  memo?: string;

  @ApiProperty({
    description: 'Transfer type',
    example: 'standard',
    enum: TransferType
  })
  @IsEnum(TransferType)
  type: TransferType;

  @ApiProperty({
    description: 'Transfer timestamp',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsString()
  timestamp: string;

  @ApiProperty({
    description: 'Transaction fee in microAIM',
    example: '1000'
  })
  @IsString()
  fee: string;
}

export class TransferHistoryRequestDto {
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
    description: 'Filter by transfer status',
    example: 'completed',
    enum: TransferStatus,
    required: false
  })
  @IsOptional()
  @IsEnum(TransferStatus)
  status?: TransferStatus;

  @ApiProperty({
    description: 'Filter by transfer type',
    example: 'standard',
    enum: TransferType,
    required: false
  })
  @IsOptional()
  @IsEnum(TransferType)
  type?: TransferType;

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
}

export class TransferStatsDto {
  @ApiProperty({
    description: 'Total number of transfers',
    example: 1000
  })
  @IsNumber()
  totalTransfers: number;

  @ApiProperty({
    description: 'Total transfer volume in microAIM',
    example: '1000000000000'
  })
  @IsString()
  totalVolume: string;

  @ApiProperty({
    description: 'Total fees paid in microAIM',
    example: '1000000'
  })
  @IsString()
  totalFees: string;

  @ApiProperty({
    description: 'Average transfer amount in microAIM',
    example: '1000000'
  })
  @IsString()
  averageAmount: string;

  @ApiProperty({
    description: 'Transfer success rate percentage',
    example: 99.5
  })
  @IsNumber()
  successRate: number;

  @ApiProperty({
    description: 'Transfers by status',
    example: {
      completed: 950,
      pending: 30,
      failed: 20
    }
  })
  transfersByStatus: Record<TransferStatus, number>;

  @ApiProperty({
    description: 'Transfers by type',
    example: {
      standard: 800,
      priority: 150,
      bulk: 50
    }
  })
  transfersByType: Record<TransferType, number>;
}
