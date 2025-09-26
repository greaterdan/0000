import { Module } from '@nestjs/common';
import { AIContentController } from './ai-content.controller';
import { AIContentService } from './ai-content.service';

@Module({
  controllers: [AIContentController],
  providers: [AIContentService],
  exports: [AIContentService],
})
export class AIContentModule {}
