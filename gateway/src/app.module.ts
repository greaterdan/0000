import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { JobsModule } from './jobs/jobs.module';
import { AuthModule } from './auth/auth.module';
import { TransferModule } from './transfer/transfer.module';
import { BalanceModule } from './balance/balance.module';
import { RatesModule } from './rates/rates.module';
import { LogModule } from './log/log.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { ErrorTrackingModule } from './error-tracking/error-tracking.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { LoggerService } from './common/logger.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpModule,
    AuthModule,
    JobsModule,
    TransferModule,
    BalanceModule,
    RatesModule,
    LogModule,
    HealthModule,
    MetricsModule,
    ErrorTrackingModule,
    MonitoringModule,
  ],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class AppModule {}
