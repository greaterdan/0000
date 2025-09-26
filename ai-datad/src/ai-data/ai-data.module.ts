import { Module } from '@nestjs/common';
import { AIDataController } from './ai-data.controller';
import { AIDataService } from './ai-data.service';

@Module({
  controllers: [AIDataController],
  providers: [AIDataService],
  exports: [AIDataService],
})
export class AIDataModule {}
