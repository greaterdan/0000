import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewDataDto {
  @ApiProperty({ description: 'Data product ID to review', example: 'uuid-string' })
  @IsString()
  dataProductId: string;

  @ApiProperty({ description: 'Overall rating from 0.0 to 5.0', example: 4.5, minimum: 0, maximum: 5 })
  @IsNumber()
  @Min(0)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ description: 'Review comment', example: 'Great dataset for NLP training!' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ description: 'Data quality rating', example: 4.0, minimum: 0, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  quality?: number;

  @ApiPropertyOptional({ description: 'Data completeness rating', example: 4.5, minimum: 0, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  completeness?: number;

  @ApiPropertyOptional({ description: 'Data accuracy rating', example: 4.2, minimum: 0, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  accuracy?: number;
}
