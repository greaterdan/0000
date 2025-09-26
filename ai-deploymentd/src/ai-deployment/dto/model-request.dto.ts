import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ModelRequestDto {
  @ApiProperty({ description: 'Deployment ID to make request to', example: 'uuid-string' })
  @IsString()
  deploymentId: string;

  @ApiProperty({ description: 'Request type', example: 'inference' })
  @IsString()
  requestType: string;

  @ApiProperty({ description: 'Request input data', example: { prompt: 'Hello, world!' } })
  @IsObject()
  input: any;

  @ApiPropertyOptional({ description: 'Request timeout in milliseconds', example: 30000 })
  @IsOptional()
  timeout?: number;

  @ApiPropertyOptional({ description: 'Request priority', example: 'high' })
  @IsOptional()
  @IsString()
  priority?: string;
}
