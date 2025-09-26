import { ErrorTrackingService } from '../common/error-tracking.service';
export declare class ErrorTrackingController {
    private readonly errorTrackingService;
    constructor(errorTrackingService: ErrorTrackingService);
    getErrorReports(limit?: number): import("../common/error-tracking.service").ErrorReport[];
    getErrorReport(id: string): import("../common/error-tracking.service").ErrorReport;
    getErrorStatistics(): {
        total: number;
        last24Hours: number;
        last7Days: number;
        severityCounts: Record<string, number>;
        serviceCounts: Record<string, number>;
        errorTypeCounts: Record<string, number>;
        resolved: number;
        unresolved: number;
    };
    getErrorsBySeverity(severity: string): import("../common/error-tracking.service").ErrorReport[];
    getErrorsByService(service: string): import("../common/error-tracking.service").ErrorReport[];
    resolveError(id: string): {
        success: boolean;
        message: string;
    };
    cleanupOldReports(): {
        clearedCount: number;
        message: string;
    };
}
