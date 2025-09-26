import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InteractAgentDto {
  @ApiProperty({ description: 'Agent ID to interact with', example: 'uuid-string' })
  @IsString()
  agentId: string;

  @ApiProperty({ description: 'Type of interaction', example: 'api_call' })
  @IsString()
  interactionType: string;

  @ApiPropertyOptional({ description: 'Input data for the interaction' })
  @IsOptional()
  @IsObject()
  input?: any;
}
