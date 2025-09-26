import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, IsEnum, IsObject, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DeploymentType {
  ENDPOINT = 'endpoint',
  SERVICE = 'service',
  BATCH = 'batch',
  STREAMING = 'streaming'
}

export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production'
}

export class DeployModelDto {
  @ApiProperty({ description: 'Model ID to deploy', example: 'uuid-string' })
  @IsString()
  modelId: string;

  @ApiProperty({ description: 'Deployment name', example: 'GPT-4 Production Endpoint' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Deployment description', example: 'High-performance GPT-4 endpoint for production use' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: DeploymentType, description: 'Type of deployment' })
  @IsEnum(DeploymentType)
  deploymentType: DeploymentType;

  @ApiProperty({ enum: Environment, description: 'Deployment environment', default: Environment.PRODUCTION })
  @IsOptional()
  @IsEnum(Environment)
  environment?: Environment;

  @ApiPropertyOptional({ description: 'Number of replicas', example: 3, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  replicas?: number;

  @ApiPropertyOptional({ description: 'Resource requirements', example: { cpu: '2', memory: '4Gi', gpu: '1' } })
  @IsOptional()
  @IsObject()
  resources?: any;

  @ApiPropertyOptional({ description: 'Auto-scaling configuration', example: { minReplicas: 1, maxReplicas: 10 } })
  @IsOptional()
  @IsObject()
  scaling?: any;

  @ApiPropertyOptional({ description: 'Monitoring configuration', example: { alerts: true, metrics: ['latency', 'throughput'] } })
  @IsOptional()
  @IsObject()
  monitoring?: any;

  @ApiPropertyOptional({ description: 'Template ID to use for deployment', example: 'uuid-string' })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Infrastructure ID to use', example: 'uuid-string' })
  @IsOptional()
  @IsString()
  infrastructureId?: string;

  @ApiPropertyOptional({ description: 'Make deployment public', default: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Additional deployment metadata' })
  @IsOptional()
  @IsObject()
  metadata?: any;
}
