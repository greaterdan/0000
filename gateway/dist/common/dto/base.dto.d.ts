export declare class BaseResponseDto {
    status: string;
    message: string;
    timestamp: string;
    correlationId?: string;
}
export declare class PaginationDto {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export declare class PaginatedResponseDto<T> extends BaseResponseDto {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export declare class ErrorResponseDto extends BaseResponseDto {
    errorCode: string;
    details?: any;
    stack?: string;
}
export declare class HealthCheckDto {
    status: string;
    service: string;
    version: string;
    uptime: number;
    timestamp: string;
    checks?: any;
}
export declare class MetricsDto {
    timestamp: string;
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
