import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AgentType {
  SERVICE = 'service',
  TOOL = 'tool',
  MODEL = 'model',
  ASSISTANT = 'assistant'
}

export class RegisterAgentDto {
  @ApiProperty({ description: 'Agent name', example: 'GPT-4 Assistant' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Agent description', example: 'Advanced AI assistant for various tasks' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: AgentType, description: 'Type of AI agent' })
  @IsEnum(AgentType)
  agentType: AgentType;

  @ApiProperty({ description: 'Agent capabilities', example: ['text-generation', 'image-processing'] })
  @IsArray()
  @IsString({ each: true })
  capabilities: string[];

  @ApiPropertyOptional({ description: 'Agent version', example: '1.0.0', default: '1.0.0' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ description: 'API endpoint URL', example: 'https://api.example.com/gpt4' })
  @IsOptional()
  @IsString()
  apiEndpoint?: string;

  @ApiPropertyOptional({ description: 'Agent documentation', example: 'Comprehensive documentation...' })
  @IsOptional()
  @IsString()
  documentation?: string;

  @ApiPropertyOptional({ description: 'Pricing model and rates' })
  @IsOptional()
  pricing?: any;

  @ApiPropertyOptional({ description: 'Is agent public', default: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Agent tags', example: ['nlp', 'assistant'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Additional agent metadata' })
  @IsOptional()
  metadata?: any;
}
