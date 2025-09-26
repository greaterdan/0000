import { IsString, IsOptional, IsObject, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UseModelDto {
  @ApiProperty({ description: 'Model ID to use', example: 'uuid-string' })
  @IsString()
  modelId: string;

  @ApiProperty({ description: 'Input data for the model' })
  @IsObject()
  input: any;

  @ApiPropertyOptional({ description: 'Maximum tokens to generate', example: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxTokens?: number;

  @ApiPropertyOptional({ description: 'Temperature for generation', example: 0.7 })
  @IsOptional()
  @IsNumber()
  temperature?: number;

  @ApiPropertyOptional({ description: 'Additional parameters' })
  @IsOptional()
  @IsObject()
  parameters?: any;
}
