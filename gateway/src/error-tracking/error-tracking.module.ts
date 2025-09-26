import { Module } from '@nestjs/common';
import { ErrorTrackingController } from './error-tracking.controller';
import { ErrorTrackingService } from '../common/error-tracking.service';
import { LoggerService } from '../common/logger.service';
import { MetricsService } from '../common/metrics.service';

@Module({
  controllers: [ErrorTrackingController],
  providers: [ErrorTrackingService, LoggerService, MetricsService],
  exports: [ErrorTrackingService],
})
export class ErrorTrackingModule {}
