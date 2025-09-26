import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DataType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  TABULAR = 'tabular',
  MULTIMODAL = 'multimodal'
}

export class CreateDatasetDto {
  @ApiProperty({ description: 'Dataset name', example: 'Custom Text Dataset' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Dataset description', example: 'High-quality text data for training' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: DataType, description: 'Type of data in the dataset' })
  @IsEnum(DataType)
  dataType: DataType;

  @ApiProperty({ description: 'Dataset size in bytes', example: 1000000000 })
  @IsNumber()
  @Min(1)
  size: number;

  @ApiProperty({ description: 'Number of records in dataset', example: 10000 })
  @IsNumber()
  @Min(1)
  recordCount: number;

  @ApiProperty({ description: 'Cost in AIM tokens to use this dataset', example: 1000 })
  @IsNumber()
  @Min(0)
  costAIM: number;

  @ApiPropertyOptional({ description: 'Is dataset public', default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Download URL for the dataset' })
  @IsOptional()
  @IsString()
  downloadUrl?: string;

  @ApiPropertyOptional({ description: 'Dataset metadata (schema, labels, etc.)' })
  @IsOptional()
  metadata?: any;

  @ApiPropertyOptional({ description: 'Dataset tags', example: ['nlp', 'classification'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
