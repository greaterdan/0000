import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ModelType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  MULTIMODAL = 'multimodal'
}

export class CreateModelDto {
  @ApiProperty({ description: 'Model name', example: 'GPT-4 Clone' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Model description', example: 'Advanced text generation model' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ModelType, description: 'Model type' })
  @IsEnum(ModelType)
  modelType: ModelType;

  @ApiProperty({ description: 'Model size in bytes', example: 5000000000 })
  @IsNumber()
  @Min(1)
  modelSize: number;

  @ApiPropertyOptional({ description: 'Model version', example: '1.0.0', default: '1.0.0' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiProperty({ description: 'Cost per token in AIM', example: 0.001 })
  @IsNumber()
  @Min(0.0001)
  costPerToken: number;

  @ApiPropertyOptional({ description: 'Model tags', example: ['nlp', 'generation'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Is model public', default: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Model URL for downloading', example: 'https://models.example.com/gpt4' })
  @IsOptional()
  @IsString()
  modelUrl?: string;

  @ApiPropertyOptional({ description: 'Model metadata configuration' })
  @IsOptional()
  metadata?: any;
}
