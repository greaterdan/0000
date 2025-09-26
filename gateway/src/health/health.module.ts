import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { HealthService } from './health.service';
import { HealthController } from './health.controller';
import { LoggerService } from '../common/logger.service';
import { MetricsService } from '../common/metrics.service';

@Module({
  imports: [HttpModule],
  providers: [HealthService, LoggerService, MetricsService],
  controllers: [HealthController],
  exports: [HealthService],
})
export class HealthModule {}
