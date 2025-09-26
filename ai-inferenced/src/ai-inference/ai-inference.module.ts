import { Module } from '@nestjs/common';
import { AIInferenceController } from './ai-inference.controller';
import { AIInferenceService } from './ai-inference.service';

@Module({
  controllers: [AIInferenceController],
  providers: [AIInferenceService],
  exports: [AIInferenceService],
})
export class AIInferenceModule {}
