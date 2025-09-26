import { Module } from '@nestjs/common';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { LoggerService } from '../common/logger.service';
import { MetricsService } from '../common/metrics.service';
import { ErrorTrackingService } from '../common/error-tracking.service';
import { HealthService } from '../health/health.service';

@Module({
  controllers: [MonitoringController],
  providers: [MonitoringService, LoggerService, MetricsService, ErrorTrackingService, HealthService],
  exports: [MonitoringService],
})
export class MonitoringModule {}
