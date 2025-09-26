import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, IsEnum, IsObject, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ValidationType {
  SAFETY = 'safety',
  PERFORMANCE = 'performance',
  ACCURACY = 'accuracy',
  BIAS = 'bias',
  SECURITY = 'security',
  COMPLIANCE = 'compliance',
  ROBUSTNESS = 'robustness'
}

export class ValidateModelDto {
  @ApiProperty({ description: 'Model ID to validate', example: 'uuid-string' })
  @IsString()
  modelId: string;

  @ApiProperty({ enum: ValidationType, description: 'Type of validation to perform' })
  @IsEnum(ValidationType)
  validationType: ValidationType;

  @ApiProperty({ description: 'Test suite configuration', example: { testCases: 100, timeout: 300 } })
  @IsObject()
  testSuite: any;

  @ApiPropertyOptional({ description: 'Custom validation parameters', example: { threshold: 0.8 } })
  @IsOptional()
  @IsObject()
  parameters?: any;

  @ApiPropertyOptional({ description: 'Template ID to use for validation', example: 'uuid-string' })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Benchmark ID to use for validation', example: 'uuid-string' })
  @IsOptional()
  @IsString()
  benchmarkId?: string;

  @ApiPropertyOptional({ description: 'Make validation results public', default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Additional comments', example: 'Custom validation for production deployment' })
  @IsOptional()
  @IsString()
  comments?: string;
}
