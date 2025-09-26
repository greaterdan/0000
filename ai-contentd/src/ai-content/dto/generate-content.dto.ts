import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ContentType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  CODE = 'code'
}

export enum ContentCategory {
  BLOG = 'blog',
  SOCIAL = 'social',
  MARKETING = 'marketing',
  EDUCATIONAL = 'educational',
  ENTERTAINMENT = 'entertainment',
  TECHNICAL = 'technical',
  CREATIVE = 'creative'
}

export class GenerateContentDto {
  @ApiProperty({ description: 'Content title', example: 'AI-Generated Blog Post' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Content description', example: 'A comprehensive blog post about AI' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ContentType, description: 'Type of content to generate' })
  @IsEnum(ContentType)
  contentType: ContentType;

  @ApiProperty({ enum: ContentCategory, description: 'Content category' })
  @IsEnum(ContentCategory)
  category: ContentCategory;

  @ApiProperty({ description: 'Generation prompt', example: 'Write a blog post about the future of AI' })
  @IsString()
  prompt: string;

  @ApiPropertyOptional({ description: 'Generation parameters', example: { maxLength: 1000, tone: 'professional' } })
  @IsOptional()
  parameters?: any;

  @ApiPropertyOptional({ description: 'AI model to use', example: 'gpt-4' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'Make content public', default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Make content available for sale', default: false })
  @IsOptional()
  @IsBoolean()
  isForSale?: boolean;

  @ApiPropertyOptional({ description: 'Sale price in AIM tokens', example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salePrice?: number;

  @ApiPropertyOptional({ description: 'Content tags', example: ['ai', 'blog', 'technology'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
