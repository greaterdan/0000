import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

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

@Injectable()
export class JobsService {
  constructor(private readonly httpService: HttpService) {}

  async submitJob(request: JobSubmitRequest, submitterAccountId: string): Promise<{ jobId: string }> {
    const mintdUrl = process.env.MINTD_URL || 'http://localhost:3003';
    
    const response = await firstValueFrom(
      this.httpService.post(`${mintdUrl}/internal/jobs/submit`, {
        submitterAccountId,
        spec: request.spec,
        inputsHash: request.inputsHash,
        attestation: request.attestation,
      })
    );
    
    return { jobId: response.data.jobId };
  }

  async getJob(jobId: string): Promise<JobResponse> {
    const mintdUrl = process.env.MINTD_URL || 'http://localhost:3003';
    
    const response = await firstValueFrom(
      this.httpService.get(`${mintdUrl}/internal/jobs/${jobId}`)
    );
    
    return {
      jobId: response.data.jobId,
      status: response.data.status,
      score: response.data.score,
      mintedMicroAim: response.data.verifierReport?.mintTransactionId,
      createdAt: response.data.createdAt,
      updatedAt: response.data.updatedAt,
    };
  }
}
