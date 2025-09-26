import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, IsObject, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateValidationBenchmarkDto {
  @ApiProperty({ description: 'Benchmark name', example: 'GLUE Benchmark' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Benchmark description', example: 'General Language Understanding Evaluation' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Model type', example: 'text' })
  @IsString()
  modelType: string;

  @ApiProperty({ description: 'Benchmark category', example: 'performance' })
  @IsString()
  category: string;

  @ApiProperty({ description: 'Benchmark dataset', example: { tasks: ['cola', 'sst2'], samples: 1000 } })
  @IsObject()
  dataset: any;

  @ApiProperty({ description: 'Evaluation metrics', example: { accuracy: 'weighted', f1: 'macro' } })
  @IsObject()
  metrics: any;

  @ApiPropertyOptional({ description: 'Baseline performance', example: { accuracy: 0.85, f1: 0.82 } })
  @IsOptional()
  @IsObject()
  baseline?: any;

  @ApiPropertyOptional({ description: 'Is benchmark active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
