import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewAgentDto {
  @ApiProperty({ description: 'Agent ID to review', example: 'uuid-string' })
  @IsString()
  agentId: string;

  @ApiProperty({ description: 'Overall rating from 0.0 to 5.0', example: 4.5, minimum: 0, maximum: 5 })
  @IsNumber()
  @Min(0)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ description: 'Review comment', example: 'Great AI agent for text generation!' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ description: 'Performance rating', example: 4.0, minimum: 0, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  performance?: number;

  @ApiPropertyOptional({ description: 'Reliability rating', example: 4.5, minimum: 0, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  reliability?: number;

  @ApiPropertyOptional({ description: 'Ease of use rating', example: 4.2, minimum: 0, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  easeOfUse?: number;

  @ApiPropertyOptional({ description: 'Value for money rating', example: 4.3, minimum: 0, maximum: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  valueForMoney?: number;
}
