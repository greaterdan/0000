import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, IsEnum, IsObject, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateValidationTemplateDto {
  @ApiProperty({ description: 'Template name', example: 'Safety Validation Template' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Template description', example: 'Comprehensive safety validation for text models' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Validation type', example: 'safety' })
  @IsString()
  validationType: string;

  @ApiProperty({ description: 'Model type', example: 'text' })
  @IsString()
  modelType: string;

  @ApiProperty({ description: 'Test suite configuration', example: { testCases: 50, timeout: 180 } })
  @IsObject()
  testSuite: any;

  @ApiPropertyOptional({ description: 'Default parameters', example: { threshold: 0.8 } })
  @IsOptional()
  @IsObject()
  parameters?: any;

  @ApiPropertyOptional({ description: 'Cost in AIM tokens', example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costAIM?: number;

  @ApiPropertyOptional({ description: 'Make template public', default: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Template tags', example: ['safety', 'text', 'validation'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
