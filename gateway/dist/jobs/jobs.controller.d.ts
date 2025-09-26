import { JobsService, JobSubmitRequest } from './jobs.service';
export declare class JobsController {
    private readonly jobsService;
    constructor(jobsService: JobsService);
    submitJob(request: JobSubmitRequest, req: any): Promise<{
        jobId: string;
    }>;
    getJob(jobId: string): Promise<import("./jobs.service").JobResponse>;
}
