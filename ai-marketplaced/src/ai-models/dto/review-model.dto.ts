import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewModelDto {
  @ApiProperty({ description: 'Model ID to review', example: 'uuid-string' })
  @IsString()
  modelId: string;

  @ApiProperty({ description: 'Rating from 0.0 to 5.0', example: 4.5, minimum: 0, maximum: 5 })
  @IsNumber()
  @Min(0)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ description: 'Review comment', example: 'Great model for text generation!' })
  @IsOptional()
  @IsString()
  comment?: string;
}
