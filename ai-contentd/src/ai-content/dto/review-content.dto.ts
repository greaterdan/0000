import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewContentDto {
  @ApiProperty({ description: 'Content ID to review', example: 'uuid-string' })
  @IsString()
  contentId: string;

  @ApiProperty({ description: 'Overall rating from 0.0 to 5.0', example: 4.5, minimum: 0, maximum: 5 })
  @IsNumber()
  @Min(0)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ description: 'Review comment', example: 'Great AI-generated content!' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ description: 'Content quality rating', example: 4.0, minimum: 0, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  quality?: number;

  @ApiPropertyOptional({ description: 'Creativity rating', example: 4.5, minimum: 0, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  creativity?: number;

  @ApiPropertyOptional({ description: 'Usefulness rating', example: 4.2, minimum: 0, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  usefulness?: number;

  @ApiPropertyOptional({ description: 'Originality rating', example: 4.3, minimum: 0, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  originality?: number;
}
