import { HealthService } from './health.service';
export declare class HealthController {
    private readonly healthService;
    constructor(healthService: HealthService);
    getHealth(): Promise<import("./health.service").HealthCheck>;
    getSimpleHealth(): {
        status: string;
        service: string;
        timestamp: string;
        version: string;
    };
}
