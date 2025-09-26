import { IsString, IsNumber, IsOptional, IsObject, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ModelType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  MULTIMODAL = 'multimodal'
}

export enum Architecture {
  TRANSFORMER = 'transformer',
  CNN = 'cnn',
  RNN = 'rnn',
  LSTM = 'lstm',
  GRU = 'gru',
  GAN = 'gan',
  VAE = 'vae',
  DIFFUSION = 'diffusion'
}

export class CreateTrainingJobDto {
  @ApiProperty({ description: 'Training job name', example: 'GPT-4 Fine-tuning' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Training job description', example: 'Fine-tune GPT-4 on custom dataset' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ModelType, description: 'Model type to train' })
  @IsEnum(ModelType)
  modelType: ModelType;

  @ApiProperty({ enum: Architecture, description: 'Model architecture' })
  @IsEnum(Architecture)
  architecture: Architecture;

  @ApiPropertyOptional({ description: 'Dataset ID to use for training' })
  @IsOptional()
  @IsString()
  datasetId?: string;

  @ApiPropertyOptional({ description: 'Dataset URL for training' })
  @IsOptional()
  @IsString()
  datasetUrl?: string;

  @ApiProperty({ description: 'Training hyperparameters', example: { learningRate: 0.001, batchSize: 32, epochs: 10 } })
  @IsObject()
  hyperparameters: {
    learningRate?: number;
    batchSize?: number;
    epochs?: number;
    optimizer?: string;
    scheduler?: string;
    weightDecay?: number;
    dropout?: number;
    [key: string]: any;
  };

  @ApiPropertyOptional({ description: 'Priority level (0-10)', example: 5, minimum: 0, maximum: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  priority?: number;
}
