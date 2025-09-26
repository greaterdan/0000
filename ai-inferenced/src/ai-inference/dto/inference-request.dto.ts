import { IsString, IsObject, IsOptional, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum RequestType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  MULTIMODAL = 'multimodal'
}

export class InferenceRequestDto {
  @ApiProperty({ description: 'Model ID to use for inference', example: 'uuid-string' })
  @IsString()
  modelId: string;

  @ApiProperty({ enum: RequestType, description: 'Type of inference request' })
  @IsEnum(RequestType)
  requestType: RequestType;

  @ApiProperty({ description: 'Input data for the model', example: { prompt: 'Hello world' } })
  @IsObject()
  input: any;

  @ApiPropertyOptional({ description: 'Maximum tokens to generate', example: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxTokens?: number;

  @ApiPropertyOptional({ description: 'Temperature for generation', example: 0.7, minimum: 0, maximum: 2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiPropertyOptional({ description: 'Top-p sampling parameter', example: 0.9, minimum: 0, maximum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  topP?: number;

  @ApiPropertyOptional({ description: 'Session ID for continuous conversation', example: 'uuid-string' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'Session name for new sessions', example: 'My Chat Session' })
  @IsOptional()
  @IsString()
  sessionName?: string;

  @ApiPropertyOptional({ description: 'Additional parameters for the model' })
  @IsOptional()
  @IsObject()
  parameters?: any;
}
