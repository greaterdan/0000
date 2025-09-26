import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from './logger.service';

// Prometheus metrics implementation
const promClient = require('prom-client');

@Injectable()
export class MetricsService {
  private register: any;
  private httpRequestDuration: any;
  private httpRequestTotal: any;
  private activeConnections: any;
  private transferAmount: any;
  private transferCount: any;
  private errorCount: any;
  private databaseOperations: any;
  private externalServiceCalls: any;
  private businessMetrics: any;
  private systemMetrics: any;
  private securityEvents: any;
  private performanceMetrics: any;

  constructor(
    private configService: ConfigService,
    private logger: LoggerService
  ) {
    this.register = new promClient.Registry();
    
    // Add default metrics
    promClient.collectDefaultMetrics({ register: this.register });
    
    // Custom metrics
    this.httpRequestDuration = new promClient.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
      registers: [this.register],
    });

    this.httpRequestTotal = new promClient.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register],
    });

    this.activeConnections = new promClient.Gauge({
      name: 'active_connections',
      help: 'Number of active connections',
      registers: [this.register],
    });

    this.transferAmount = new promClient.Histogram({
      name: 'transfer_amount_micro_aim',
      help: 'Amount of AIM transferred',
      labelNames: ['from_kind', 'to_kind'],
      buckets: [1000, 10000, 100000, 1000000, 10000000, 100000000],
      registers: [this.register],
    });

    this.transferCount = new promClient.Counter({
      name: 'transfers_total',
      help: 'Total number of transfers',
      labelNames: ['from_kind', 'to_kind', 'status'],
      registers: [this.register],
    });

    this.errorCount = new promClient.Counter({
      name: 'errors_total',
      help: 'Total number of errors',
      labelNames: ['service', 'error_type'],
      registers: [this.register],
    });

    // Database operation metrics
    this.databaseOperations = new promClient.Histogram({
      name: 'database_operations_duration_seconds',
      help: 'Duration of database operations in seconds',
      labelNames: ['operation', 'table', 'status'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
      registers: [this.register],
    });

    // External service call metrics
    this.externalServiceCalls = new promClient.Histogram({
      name: 'external_service_calls_duration_seconds',
      help: 'Duration of external service calls in seconds',
      labelNames: ['service', 'operation', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
      registers: [this.register],
    });

    // Business metrics
    this.businessMetrics = new promClient.Counter({
      name: 'business_events_total',
      help: 'Total number of business events',
      labelNames: ['event_type', 'account_kind', 'status'],
      registers: [this.register],
    });

    // System metrics
    this.systemMetrics = new promClient.Gauge({
      name: 'system_health_score',
      help: 'System health score (0-100)',
      labelNames: ['component'],
      registers: [this.register],
    });

    // Security events
    this.securityEvents = new promClient.Counter({
      name: 'security_events_total',
      help: 'Total number of security events',
      labelNames: ['event_type', 'severity', 'source'],
      registers: [this.register],
    });

    // Performance metrics
    this.performanceMetrics = new promClient.Gauge({
      name: 'performance_indicators',
      help: 'Performance indicators',
      labelNames: ['indicator', 'component'],
      registers: [this.register],
    });
  }

  // HTTP request metrics
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
    this.httpRequestDuration
      .labels(method, route, statusCode.toString())
      .observe(duration);
    
    this.httpRequestTotal
      .labels(method, route, statusCode.toString())
      .inc();
  }

  // Connection metrics
  incrementActiveConnections() {
    this.activeConnections.inc();
  }

  decrementActiveConnections() {
    this.activeConnections.dec();
  }

  // Transfer metrics
  recordTransfer(fromKind: string, toKind: string, amount: number, status: string) {
    this.transferAmount
      .labels(fromKind, toKind)
      .observe(amount);
    
    this.transferCount
      .labels(fromKind, toKind, status)
      .inc();
  }

  // Error metrics
  recordError(service: string, errorType: string) {
    this.errorCount
      .labels(service, errorType)
      .inc();
  }

  // Get metrics in Prometheus format
  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  // Database operation metrics
  recordDatabaseOperation(operation: string, table: string, duration: number, status: string) {
    this.databaseOperations
      .labels(operation, table, status)
      .observe(duration);
    
    this.logger.logDatabase(operation, table, duration, { status });
  }

  // External service call metrics
  recordExternalServiceCall(service: string, operation: string, duration: number, status: string) {
    this.externalServiceCalls
      .labels(service, operation, status)
      .observe(duration);
    
    this.logger.logExternalService(service, operation, duration, status);
  }

  // Business metrics
  recordBusinessEvent(eventType: string, accountKind: string, status: string) {
    this.businessMetrics
      .labels(eventType, accountKind, status)
      .inc();
    
    this.logger.logBusinessEvent(eventType, { accountKind, status });
  }

  // System health metrics
  updateSystemHealth(component: string, score: number) {
    this.systemMetrics
      .labels(component)
      .set(score);
    
    this.logger.logHealth('system_health', { component, score });
  }

  // Security event metrics
  recordSecurityEvent(eventType: string, severity: string, source: string) {
    this.securityEvents
      .labels(eventType, severity, source)
      .inc();
    
    this.logger.logSecurity(eventType, { severity, source });
  }

  // Performance metrics
  updatePerformanceIndicator(indicator: string, component: string, value: number) {
    this.performanceMetrics
      .labels(indicator, component)
      .set(value);
    
    this.logger.logPerformance(indicator, value, { component });
  }

  // Health check metrics
  getHealthMetrics() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      uptime: process.uptime(),
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        arrayBuffers: memoryUsage.arrayBuffers,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      timestamp: new Date().toISOString(),
      version: process.version,
      platform: process.platform,
      arch: process.arch,
    };
  }

  // Get all metrics in Prometheus format
  async getAllMetrics(): Promise<string> {
    return this.register.metrics();
  }

  // Get metrics summary for dashboards
  getMetricsSummary() {
    return {
      httpRequests: this.httpRequestTotal,
      activeConnections: this.activeConnections,
      transfers: this.transferCount,
      errors: this.errorCount,
      businessEvents: this.businessMetrics,
      securityEvents: this.securityEvents,
      systemHealth: this.systemMetrics,
      performance: this.performanceMetrics,
    };
  }
}
