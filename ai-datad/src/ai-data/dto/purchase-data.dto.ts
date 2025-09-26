import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PurchaseDataDto {
  @ApiProperty({ description: 'Data product ID to purchase', example: 'uuid-string' })
  @IsString()
  dataProductId: string;

  @ApiPropertyOptional({ description: 'Maximum downloads allowed', example: 5, default: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxDownloads?: number;
}
