import { HttpService } from '@nestjs/axios';
export interface JobSubmitRequest {
    spec: Record<string, any>;
    inputsHash: string;
    attestation?: Record<string, any>;
}
export interface JobResponse {
    jobId: string;
    status: string;
    score?: number;
    mintedMicroAim?: string;
    createdAt: string;
    updatedAt: string;
}
export declare class JobsService {
    private readonly httpService;
    constructor(httpService: HttpService);
    submitJob(request: JobSubmitRequest, submitterAccountId: string): Promise<{
        jobId: string;
    }>;
    getJob(jobId: string): Promise<JobResponse>;
}
