import { Module } from '@nestjs/common';
import { AIValidationController } from './ai-validation.controller';
import { AIValidationService } from './ai-validation.service';

@Module({
  controllers: [AIValidationController],
  providers: [AIValidationService],
  exports: [AIValidationService],
})
export class AIValidationModule {}
