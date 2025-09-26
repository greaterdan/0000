import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { MonitoringService } from './monitoring.service';

@ApiTags('Monitoring')
@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('dashboard')
  @ApiOperation({ 
    summary: 'Get monitoring dashboard',
    description: 'Retrieve comprehensive monitoring dashboard with system, business, and performance metrics'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Monitoring dashboard retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        overview: { type: 'object' },
        system: { type: 'object' },
        business: { type: 'object' },
        errors: { type: 'object' },
        performance: { type: 'object' },
        security: { type: 'object' },
        services: { type: 'array' }
      }
    }
  })
  async getDashboard() {
    return await this.monitoringService.getDashboard();
  }

  @Get('realtime')
  @ApiOperation({ 
    summary: 'Get real-time metrics',
    description: 'Retrieve real-time system and performance metrics'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Real-time metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        timestamp: { type: 'string' },
        system: { type: 'object' },
        performance: { type: 'object' },
        security: { type: 'object' }
      }
    }
  })
  getRealTimeMetrics() {
    return this.monitoringService.getRealTimeMetrics();
  }

  @Get('historical')
  @ApiOperation({ 
    summary: 'Get historical metrics',
    description: 'Retrieve historical metrics for the specified time range'
  })
  @ApiQuery({ name: 'timeRange', required: false, type: String, description: 'Time range for historical data (e.g., 1h, 24h, 7d)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Historical metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        timeRange: { type: 'string' },
        data: { type: 'array' },
        message: { type: 'string' }
      }
    }
  })
  getHistoricalMetrics(@Query('timeRange') timeRange?: string) {
    return this.monitoringService.getHistoricalMetrics(timeRange);
  }

  @Get('alerts')
  @ApiOperation({ 
    summary: 'Get alerts and notifications',
    description: 'Retrieve current alerts and notifications based on system conditions'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Alerts retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          severity: { type: 'string' },
          message: { type: 'string' },
          count: { type: 'number' },
          percentage: { type: 'number' },
          usage: { type: 'number' }
        }
      }
    }
  })
  getAlerts() {
    return this.monitoringService.getAlerts();
  }
}
