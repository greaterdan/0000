import { Module } from '@nestjs/common';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { LoggerService } from '../common/logger.service';
import { MetricsService } from '../common/metrics.service';
import { ErrorTrackingService } from '../common/error-tracking.service';
import { HealthService } from '../health/health.service';
import { HealthModule } from '../health/health.module';

@Module({
  imports: [HealthModule],
  controllers: [MonitoringController],
  providers: [MonitoringService, LoggerService, MetricsService, ErrorTrackingService],
  exports: [MonitoringService],
})
export class MonitoringModule {}
