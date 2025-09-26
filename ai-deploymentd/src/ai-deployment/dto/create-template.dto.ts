import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, IsEnum, IsObject, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDeploymentTemplateDto {
  @ApiProperty({ description: 'Template name', example: 'High-Performance Endpoint Template' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Template description', example: 'Optimized template for high-performance model endpoints' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Deployment type', example: 'endpoint' })
  @IsString()
  deploymentType: string;

  @ApiProperty({ description: 'Target environment', example: 'production' })
  @IsString()
  environment: string;

  @ApiProperty({ description: 'Resource requirements', example: { cpu: '4', memory: '8Gi', gpu: '1' } })
  @IsObject()
  resources: any;

  @ApiPropertyOptional({ description: 'Auto-scaling configuration', example: { minReplicas: 2, maxReplicas: 20 } })
  @IsOptional()
  @IsObject()
  scaling?: any;

  @ApiPropertyOptional({ description: 'Monitoring configuration', example: { alerts: true, metrics: ['latency', 'throughput', 'error_rate'] } })
  @IsOptional()
  @IsObject()
  monitoring?: any;

  @ApiPropertyOptional({ description: 'Make template public', default: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Template tags', example: ['high-performance', 'production', 'gpu'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
