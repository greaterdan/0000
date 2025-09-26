import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PurchaseContentDto {
  @ApiProperty({ description: 'Content ID to purchase', example: 'uuid-string' })
  @IsString()
  contentId: string;

  @ApiPropertyOptional({ description: 'Maximum downloads allowed', example: 5, default: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxDownloads?: number;
}
