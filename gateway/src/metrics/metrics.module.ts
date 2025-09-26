import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsService } from '../common/metrics.service';
import { LoggerService } from '../common/logger.service';

@Module({
  controllers: [MetricsController],
  providers: [MetricsService, LoggerService],
  exports: [MetricsService],
})
export class MetricsModule {}
