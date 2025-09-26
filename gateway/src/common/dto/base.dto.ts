import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsDateString, IsNumber, IsBoolean } from 'class-validator';

export class BaseResponseDto {
  @ApiProperty({
    description: 'Response status',
    example: 'success',
    enum: ['success', 'error', 'warning']
  })
  @IsString()
  status: string;

  @ApiProperty({
    description: 'Response message',
    example: 'Operation completed successfully'
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Response timestamp',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsDateString()
  timestamp: string;

  @ApiProperty({
    description: 'Request correlation ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsUUID()
  correlationId?: string;
}

export class PaginationDto {
  @ApiProperty({
    description: 'Page number (1-based)',
    example: 1,
    minimum: 1,
    default: 1
  })
  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20
  })
  @IsNumber()
  @IsOptional()
  limit?: number = 20;

  @ApiProperty({
    description: 'Sort field',
    example: 'createdAt'
  })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiProperty({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc'
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class PaginatedResponseDto<T> extends BaseResponseDto {
  @ApiProperty({
    description: 'Array of items'
  })
  data: T[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: {
      page: 1,
      limit: 20,
      total: 100,
      totalPages: 5,
      hasNext: true,
      hasPrev: false
    }
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class ErrorResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'Error code',
    example: 'VALIDATION_ERROR'
  })
  @IsString()
  errorCode: string;

  @ApiProperty({
    description: 'Detailed error information',
    example: {
      field: 'email',
      message: 'Invalid email format'
    }
  })
  @IsOptional()
  details?: any;

  @ApiProperty({
    description: 'Error stack trace (development only)',
    example: 'Error: Validation failed\n    at ...'
  })
  @IsOptional()
  @IsString()
  stack?: string;
}

export class HealthCheckDto {
  @ApiProperty({
    description: 'Service health status',
    example: 'healthy',
    enum: ['healthy', 'unhealthy', 'degraded']
  })
  @IsString()
  status: string;

  @ApiProperty({
    description: 'Service name',
    example: 'gateway'
  })
  @IsString()
  service: string;

  @ApiProperty({
    description: 'Service version',
    example: '1.0.0'
  })
  @IsString()
  version: string;

  @ApiProperty({
    description: 'Service uptime in seconds',
    example: 3600
  })
  @IsNumber()
  uptime: number;

  @ApiProperty({
    description: 'Health check timestamp',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsDateString()
  timestamp: string;

  @ApiProperty({
    description: 'Detailed health information',
    example: {
      database: { status: 'healthy', responseTime: 5 },
      redis: { status: 'healthy', responseTime: 2 }
    }
  })
  @IsOptional()
  checks?: any;
}

export class MetricsDto {
  @ApiProperty({
    description: 'Metrics timestamp',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsDateString()
  timestamp: string;

  @ApiProperty({
    description: 'System metrics',
    example: {
      memory: { used: 1024, total: 2048, percentage: 50 },
      cpu: { usage: 25.5 }
    }
  })
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
  };

  @ApiProperty({
    description: 'Application metrics',
    example: {
      requests: { total: 1000, errors: 5, successRate: 99.5 },
      responseTime: { average: 150, p95: 300, p99: 500 }
    }
  })
  application: {
    requests: {
      total: number;
      errors: number;
      successRate: number;
    };
    responseTime: {
      average: number;
      p95: number;
      p99: number;
    };
  };
}
