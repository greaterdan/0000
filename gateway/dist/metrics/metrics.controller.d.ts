import { Response } from 'express';
import { MetricsService } from '../common/metrics.service';
export declare class MetricsController {
    private readonly metricsService;
    constructor(metricsService: MetricsService);
    getMetrics(res: Response): Promise<void>;
    getHealthMetrics(): {
        uptime: number;
        memory: {
            rss: number;
            heapTotal: number;
            heapUsed: number;
            external: number;
            arrayBuffers: number;
        };
        cpu: {
            user: number;
            system: number;
        };
        timestamp: string;
        version: string;
        platform: NodeJS.Platform;
        arch: NodeJS.Architecture;
    };
}
