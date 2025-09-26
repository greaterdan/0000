import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Comprehensive health check endpoint',
    description: 'Returns detailed health status including database, external services, system, and business metrics'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Health check completed',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['healthy', 'unhealthy', 'degraded'] },
        timestamp: { type: 'string' },
        version: { type: 'string' },
        uptime: { type: 'number' },
        checks: {
          type: 'object',
          properties: {
            database: { type: 'object' },
            externalServices: { type: 'array' },
            system: { type: 'object' },
            business: { type: 'object' }
          }
        }
      }
    }
  })
  async getHealth() {
    return await this.healthService.getHealth();
  }

  @Get('simple')
  @ApiOperation({ summary: 'Simple health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getSimpleHealth() {
    return {
      status: 'healthy',
      service: 'gateway',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}
