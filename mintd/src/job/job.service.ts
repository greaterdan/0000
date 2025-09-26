import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NatsService } from '../nats/nats.service';
import { JobStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export interface SubmitJobRequest {
  submitterAccountId: string;
  spec: Record<string, any>;
  inputsHash: string;
  attestation?: Record<string, any>;
}

export interface JobResponse {
  jobId: string;
  status: JobStatus;
  submitterAccountId: string;
  spec: Record<string, any>;
  inputsHash: string;
  attestation?: Record<string, any>;
  score?: number;
  verifierReport?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class JobService {
  constructor(
    private prisma: PrismaService,
    private natsService: NatsService,
  ) {}

  async submitJob(request: SubmitJobRequest): Promise<JobResponse> {
    // Validate submitter account exists
    const account = await this.prisma.account.findUnique({
      where: { id: request.submitterAccountId },
    });

    if (!account) {
      throw new NotFoundException(`Account ${request.submitterAccountId} not found`);
    }

    // Only allow AI agents to submit jobs
    if (account.kind !== 'agent') {
      throw new BadRequestException('Only AI agents can submit jobs for minting');
    }

    // Create job record
    const job = await this.prisma.job.create({
      data: {
        id: uuidv4(),
        submitterAccountId: request.submitterAccountId,
        spec: request.spec,
        inputsHash: Buffer.from(request.inputsHash, 'hex'),
        attestation: request.attestation,
        status: 'submitted',
      },
    });

    // Publish job_submitted event to NATS
    await this.natsService.publishJobSubmitted({
      jobId: job.id,
      submitterAccountId: job.submitterAccountId,
      inputsHash: request.inputsHash,
      spec: request.spec,
      attestation: request.attestation,
      timestamp: Date.now(),
    });

    return {
      jobId: job.id,
      status: job.status,
      submitterAccountId: job.submitterAccountId,
      spec: job.spec as Record<string, any>,
      inputsHash: request.inputsHash,
      attestation: job.attestation as Record<string, any> | undefined,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }

  async getJob(jobId: string): Promise<JobResponse> {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    return {
      jobId: job.id,
      status: job.status,
      submitterAccountId: job.submitterAccountId,
      spec: job.spec as Record<string, any>,
      inputsHash: Buffer.from(job.inputsHash).toString('hex'),
      attestation: job.attestation as Record<string, any> | undefined,
      score: job.score || undefined,
      verifierReport: job.verifierReport as Record<string, any> | undefined,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }

  async updateJobScore(
    jobId: string,
    score: number,
    report: Record<string, any>
  ): Promise<void> {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    await this.prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'scored',
        score,
        verifierReport: report,
      },
    });

    // Publish job_scored event to NATS
    await this.natsService.publishJobScored({
      jobId,
      score,
      report,
      timestamp: Date.now(),
    });
  }

  async markJobAsMinted(jobId: string, transactionId: string): Promise<void> {
    await this.prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'minted',
        verifierReport: {
          ...((await this.prisma.job.findUnique({ where: { id: jobId } }))?.verifierReport as Record<string, any> || {}),
          mintTransactionId: transactionId,
        },
      },
    });
  }

  async markJobAsRejected(jobId: string, reason: string): Promise<void> {
    await this.prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'rejected',
        verifierReport: {
          ...((await this.prisma.job.findUnique({ where: { id: jobId } }))?.verifierReport as Record<string, any> || {}),
          rejectionReason: reason,
        },
      },
    });
  }

  async listJobs(
    submitterAccountId?: string,
    status?: JobStatus,
    limit: number = 100
  ): Promise<JobResponse[]> {
    const jobs = await this.prisma.job.findMany({
      where: {
        ...(submitterAccountId && { submitterAccountId }),
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return jobs.map(job => ({
      jobId: job.id,
      status: job.status,
      submitterAccountId: job.submitterAccountId,
      spec: job.spec as Record<string, any>,
      inputsHash: Buffer.from(job.inputsHash).toString('hex'),
      attestation: job.attestation as Record<string, any> | undefined,
      score: job.score || undefined,
      verifierReport: job.verifierReport as Record<string, any> | undefined,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    }));
  }

  async getJobsByStatus(status: JobStatus): Promise<JobResponse[]> {
    return this.listJobs(undefined, status);
  }

  async getJobsBySubmitter(submitterAccountId: string): Promise<JobResponse[]> {
    return this.listJobs(submitterAccountId);
  }
}
