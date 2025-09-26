import { Module } from '@nestjs/common';
import { AITrainingController } from './ai-training.controller';
import { AITrainingService } from './ai-training.service';

@Module({
  controllers: [AITrainingController],
  providers: [AITrainingService],
  exports: [AITrainingService],
})
export class AITrainingModule {}
