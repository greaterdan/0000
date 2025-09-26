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

export enum License {
  COMMERCIAL = 'commercial',
  RESEARCH = 'research',
  OPEN = 'open',
  CUSTOM = 'custom'
}

export class CreateDataProductDto {
  @ApiProperty({ description: 'Data product name', example: 'High-Quality Text Dataset' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Data product description', example: 'Clean, annotated text data for NLP training' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: DataType, description: 'Type of data' })
  @IsEnum(DataType)
  dataType: DataType;

  @ApiProperty({ description: 'Data category', example: 'nlp' })
  @IsString()
  category: string;

  @ApiProperty({ description: 'Data size in bytes', example: 1000000000 })
  @IsNumber()
  @Min(1)
  size: number;

  @ApiProperty({ description: 'Number of records', example: 10000 })
  @IsNumber()
  @Min(1)
  recordCount: number;

  @ApiProperty({ description: 'Cost in AIM tokens', example: 1000 })
  @IsNumber()
  @Min(0)
  costAIM: number;

  @ApiPropertyOptional({ description: 'Is data product public', default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Download URL', example: 'https://data.example.com/dataset.zip' })
  @IsOptional()
  @IsString()
  downloadUrl?: string;

  @ApiPropertyOptional({ description: 'Preview URL', example: 'https://data.example.com/preview' })
  @IsOptional()
  @IsString()
  previewUrl?: string;

  @ApiPropertyOptional({ description: 'Data metadata (schema, labels, etc.)' })
  @IsOptional()
  metadata?: any;

  @ApiPropertyOptional({ description: 'Data tags', example: ['nlp', 'classification'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ enum: License, description: 'Data license', default: License.RESEARCH })
  @IsOptional()
  @IsEnum(License)
  license?: License;
}
