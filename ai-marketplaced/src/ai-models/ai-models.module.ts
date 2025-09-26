import { Module } from '@nestjs/common';
import { AIModelsController } from './ai-models.controller';
import { AIModelsService } from './ai-models.service';

@Module({
  controllers: [AIModelsController],
  providers: [AIModelsService],
  exports: [AIModelsService],
})
export class AIModelsModule {}
