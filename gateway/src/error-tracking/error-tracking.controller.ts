import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ErrorTrackingService } from '../common/error-tracking.service';

@ApiTags('Error Tracking')
@Controller('error-tracking')
export class ErrorTrackingController {
  constructor(private readonly errorTrackingService: ErrorTrackingService) {}

  @Get('reports')
  @ApiOperation({ 
    summary: 'Get error reports',
    description: 'Retrieve error reports with optional filtering'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of reports to return' })
  @ApiResponse({ 
    status: 200, 
    description: 'Error reports retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          timestamp: { type: 'string' },
          error: { type: 'object' },
          context: { type: 'object' },
          severity: { type: 'string' },
          service: { type: 'string' },
          resolved: { type: 'boolean' }
        }
      }
    }
  })
  getErrorReports(@Query('limit') limit?: number) {
    return this.errorTrackingService.getErrorReports(limit);
  }

  @Get('reports/:id')
  @ApiOperation({ summary: 'Get specific error report' })
  @ApiParam({ name: 'id', description: 'Error report ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Error report retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        timestamp: { type: 'string' },
        error: { type: 'object' },
        context: { type: 'object' },
        severity: { type: 'string' },
        service: { type: 'string' },
        resolved: { type: 'boolean' }
      }
    }
  })
  getErrorReport(@Param('id') id: string) {
    return this.errorTrackingService.getErrorReport(id);
  }

  @Get('statistics')
  @ApiOperation({ 
    summary: 'Get error statistics',
    description: 'Retrieve error statistics and metrics'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Error statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        last24Hours: { type: 'number' },
        last7Days: { type: 'number' },
        severityCounts: { type: 'object' },
        serviceCounts: { type: 'object' },
        errorTypeCounts: { type: 'object' },
        resolved: { type: 'number' },
        unresolved: { type: 'number' }
      }
    }
  })
  getErrorStatistics() {
    return this.errorTrackingService.getErrorStatistics();
  }

  @Get('reports/severity/:severity')
  @ApiOperation({ summary: 'Get error reports by severity' })
  @ApiParam({ name: 'severity', description: 'Error severity level', enum: ['low', 'medium', 'high', 'critical'] })
  @ApiResponse({ 
    status: 200, 
    description: 'Error reports retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          timestamp: { type: 'string' },
          error: { type: 'object' },
          severity: { type: 'string' }
        }
      }
    }
  })
  getErrorsBySeverity(@Param('severity') severity: string) {
    return this.errorTrackingService.getErrorsBySeverity(severity);
  }

  @Get('reports/service/:service')
  @ApiOperation({ summary: 'Get error reports by service' })
  @ApiParam({ name: 'service', description: 'Service name' })
  @ApiResponse({ 
    status: 200, 
    description: 'Error reports retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          timestamp: { type: 'string' },
          error: { type: 'object' },
          service: { type: 'string' }
        }
      }
    }
  })
  getErrorsByService(@Param('service') service: string) {
    return this.errorTrackingService.getErrorsByService(service);
  }

  @Post('reports/:id/resolve')
  @ApiOperation({ summary: 'Mark error as resolved' })
  @ApiParam({ name: 'id', description: 'Error report ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Error marked as resolved',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  })
  resolveError(@Param('id') id: string) {
    const success = this.errorTrackingService.resolveError(id);
    return {
      success,
      message: success ? 'Error marked as resolved' : 'Error not found'
    };
  }

  @Post('cleanup')
  @ApiOperation({ summary: 'Clean up old error reports' })
  @ApiResponse({ 
    status: 200, 
    description: 'Old error reports cleaned up',
    schema: {
      type: 'object',
      properties: {
        clearedCount: { type: 'number' },
        message: { type: 'string' }
      }
    }
  })
  cleanupOldReports() {
    const clearedCount = this.errorTrackingService.clearOldReports();
    return {
      clearedCount,
      message: `Cleared ${clearedCount} old error reports`
    };
  }
}
