import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from './logger.service';
import { MetricsService } from './metrics.service';

export interface ErrorContext {
  userId?: string;
  accountId?: string;
  transactionId?: string;
  requestId?: string;
  correlationId?: string;
  userAgent?: string;
  ip?: string;
  endpoint?: string;
  method?: string;
  [key: string]: any;
}

export interface ErrorReport {
  id: string;
  timestamp: string;
  error: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  service: string;
  environment: string;
  version: string;
  resolved: boolean;
  tags: string[];
}

@Injectable()
export class ErrorTrackingService {
  private readonly serviceName = 'gateway';
  private readonly version = '1.0.0';
  private errorReports: Map<string, ErrorReport> = new Map();
  private readonly maxReports = 1000; // Keep last 1000 errors in memory

  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
    private metrics: MetricsService
  ) {}

  // Track and report errors
  trackError(
    error: Error,
    context: ErrorContext = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): string {
    const errorId = this.generateErrorId();
    const timestamp = new Date().toISOString();
    const environment = this.configService.get('NODE_ENV', 'development');

    const errorReport: ErrorReport = {
      id: errorId,
      timestamp,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      },
      context,
      severity,
      service: this.serviceName,
      environment,
      version: this.version,
      resolved: false,
      tags: this.generateTags(error, context),
    };

    // Store error report
    this.storeErrorReport(errorReport);

    // Log error
    this.logger.logError(error, context);

    // Update metrics
    this.metrics.recordError(severity, error.name);
    this.metrics.recordSecurityEvent('error_occurred', severity, this.serviceName);

    // Send to external error tracking service if configured
    this.sendToExternalService(errorReport);

    return errorId;
  }

  // Track specific error types
  trackValidationError(error: Error, context: ErrorContext) {
    return this.trackError(error, context, 'low');
  }

  trackAuthenticationError(error: Error, context: ErrorContext) {
    return this.trackError(error, context, 'high');
  }

  trackAuthorizationError(error: Error, context: ErrorContext) {
    return this.trackError(error, context, 'high');
  }

  trackDatabaseError(error: Error, context: ErrorContext) {
    return this.trackError(error, context, 'critical');
  }

  trackExternalServiceError(error: Error, context: ErrorContext) {
    return this.trackError(error, context, 'medium');
  }

  trackBusinessLogicError(error: Error, context: ErrorContext) {
    return this.trackError(error, context, 'medium');
  }

  trackSecurityError(error: Error, context: ErrorContext) {
    return this.trackError(error, context, 'critical');
  }

  // Get error reports
  getErrorReports(limit: number = 50): ErrorReport[] {
    const reports = Array.from(this.errorReports.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return reports;
  }

  getErrorReport(errorId: string): ErrorReport | undefined {
    return this.errorReports.get(errorId);
  }

  getErrorsBySeverity(severity: string): ErrorReport[] {
    return Array.from(this.errorReports.values())
      .filter(report => report.severity === severity)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getErrorsByService(service: string): ErrorReport[] {
    return Array.from(this.errorReports.values())
      .filter(report => report.service === service)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Error statistics
  getErrorStatistics() {
    const reports = Array.from(this.errorReports.values());
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const last24HoursErrors = reports.filter(r => new Date(r.timestamp) > last24Hours);
    const last7DaysErrors = reports.filter(r => new Date(r.timestamp) > last7Days);

    const severityCounts = reports.reduce((acc, report) => {
      acc[report.severity] = (acc[report.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const serviceCounts = reports.reduce((acc, report) => {
      acc[report.service] = (acc[report.service] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const errorTypeCounts = reports.reduce((acc, report) => {
      const errorType = report.error.name;
      acc[errorType] = (acc[errorType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: reports.length,
      last24Hours: last24HoursErrors.length,
      last7Days: last7DaysErrors.length,
      severityCounts,
      serviceCounts,
      errorTypeCounts,
      resolved: reports.filter(r => r.resolved).length,
      unresolved: reports.filter(r => !r.resolved).length,
    };
  }

  // Mark error as resolved
  resolveError(errorId: string): boolean {
    const report = this.errorReports.get(errorId);
    if (report) {
      report.resolved = true;
      this.logger.log('Error resolved', { errorId, error: report.error.name });
      return true;
    }
    return false;
  }

  // Clear old error reports
  clearOldReports(olderThanDays: number = 30) {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    let clearedCount = 0;

    for (const [id, report] of this.errorReports.entries()) {
      if (new Date(report.timestamp) < cutoffDate) {
        this.errorReports.delete(id);
        clearedCount++;
      }
    }

    this.logger.log('Cleared old error reports', { clearedCount, olderThanDays });
    return clearedCount;
  }

  // Private methods
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTags(error: Error, context: ErrorContext): string[] {
    const tags = [error.name, this.serviceName];
    
    if (context.endpoint) {
      tags.push(`endpoint:${context.endpoint}`);
    }
    
    if (context.method) {
      tags.push(`method:${context.method}`);
    }
    
    if (context.userId) {
      tags.push('user_error');
    }
    
    if (context.transactionId) {
      tags.push('transaction_error');
    }
    
    return tags;
  }

  private storeErrorReport(report: ErrorReport) {
    // Store in memory (in production, this would be stored in a database)
    this.errorReports.set(report.id, report);
    
    // Keep only the most recent reports
    if (this.errorReports.size > this.maxReports) {
      const oldestReport = Array.from(this.errorReports.values())
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())[0];
      this.errorReports.delete(oldestReport.id);
    }
  }

  private async sendToExternalService(report: ErrorReport) {
    // In production, this would send to services like Sentry, Bugsnag, etc.
    const externalServiceUrl = this.configService.get('ERROR_TRACKING_URL');
    
    if (externalServiceUrl) {
      try {
        // This would be an actual HTTP request to the error tracking service
        this.logger.debug('Sending error to external service', { 
          errorId: report.id, 
          service: externalServiceUrl 
        });
      } catch (error) {
        this.logger.error('Failed to send error to external service', error.stack);
      }
    }
  }
}
