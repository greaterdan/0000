import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

export interface CreateDisputeRequest {
  jobId: string;
  reason: string;
  evidence?: Record<string, any>;
}

export interface DisputeResponse {
  disputeId: string;
  jobId: string;
  status: 'open' | 'investigating' | 'resolved' | 'rejected';
  reason: string;
  evidence?: Record<string, any>;
  createdAt: Date;
  resolvedAt?: Date;
  resolution?: string;
}

@Injectable()
export class DisputesService {
  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  async createDispute(request: CreateDisputeRequest): Promise<DisputeResponse> {
    // Verify job exists and is minted
    const job = await this.prisma.job.findUnique({
      where: { id: request.jobId },
    });

    if (!job) {
      throw new NotFoundException(`Job ${request.jobId} not found`);
    }

    if (job.status !== 'minted') {
      throw new BadRequestException('Can only dispute minted jobs');
    }

    // Check if dispute window is still open (24 hours)
    const disputeWindow = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const timeSinceMint = Date.now() - job.updatedAt.getTime();
    
    if (timeSinceMint > disputeWindow) {
      throw new BadRequestException('Dispute window has expired (24 hours)');
    }

    // Check if dispute already exists
    const existingDispute = await this.prisma.dispute.findFirst({
      where: { jobId: request.jobId },
    });

    if (existingDispute) {
      throw new BadRequestException('Dispute already exists for this job');
    }

    // Lock funds by creating a negative balance entry
    await this.lockFunds(job.submitterAccountId, job.id);

    // Create dispute record
    const dispute = await this.prisma.dispute.create({
      data: {
        id: uuidv4(),
        jobId: request.jobId,
        submitterAccountId: job.submitterAccountId,
        reason: request.reason,
        evidence: request.evidence || {},
        status: 'open',
        createdAt: new Date(),
      },
    });

    // Schedule re-verification
    await this.scheduleReVerification(dispute.id);

    return {
      disputeId: dispute.id,
      jobId: dispute.jobId,
      status: dispute.status as any,
      reason: dispute.reason,
      evidence: dispute.evidence as Record<string, any>,
      createdAt: dispute.createdAt,
    };
  }

  private async lockFunds(accountId: string, jobId: string) {
    const ledgerdUrl = process.env.LEDGERD_URL || 'http://localhost:3001';
    
    // Get the minted amount from the job
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job || !job.verifierReport) {
      throw new BadRequestException('Cannot determine minted amount');
    }

    const mintedAmount = (job.verifierReport as any).mintTransactionId;
    if (!mintedAmount) {
      throw new BadRequestException('No minted amount found');
    }

    // Create a negative balance adjustment to lock funds
    await firstValueFrom(
      this.httpService.post(`${ledgerdUrl}/internal/transfer`, {
        from: accountId,
        to: 'dispute-escrow',
        microAmount: mintedAmount,
        memo: `Dispute lock for job ${jobId}`,
      })
    );
  }

  private async scheduleReVerification(disputeId: string) {
    // In a real implementation, this would schedule a background job
    // For now, we'll trigger immediate re-verification
    setTimeout(() => {
      this.processDispute(disputeId);
    }, 5000); // 5 second delay for demo
  }

  async processDispute(disputeId: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      throw new NotFoundException(`Dispute ${disputeId} not found`);
    }

    if (dispute.status !== 'open') {
      return; // Already processed
    }

    // Update status to investigating
    await this.prisma.dispute.update({
      where: { id: disputeId },
      data: { status: 'investigating' },
    });

    try {
      // Re-verify the job with higher confidence
      const reVerificationResult = await this.reVerifyJob(dispute.jobId);

      if (reVerificationResult.score < 0.9) { // Higher threshold for disputes
        // Uphold dispute - job was incorrectly verified
        await this.upholdDispute(disputeId, reVerificationResult);
      } else {
        // Reject dispute - job was correctly verified
        await this.rejectDispute(disputeId, reVerificationResult);
      }
    } catch (error) {
      // If re-verification fails, uphold the dispute
      await this.upholdDispute(disputeId, { score: 0, report: { error: error.message } });
    }
  }

  private async reVerifyJob(jobId: string) {
    const verifierUrl = process.env.VERIFIER_URL || 'http://localhost:3006';
    
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    const response = await firstValueFrom(
      this.httpService.post(`${verifierUrl}/score`, {
        jobId: job.id,
        inputsHash: Buffer.from(job.inputsHash).toString('hex'),
        spec: job.spec,
      })
    );

    return response.data;
  }

  private async upholdDispute(disputeId: string, reVerificationResult: any) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) return;

    // Create compensating journal entry to debit the minter
    await this.createCompensatingEntry(dispute);

    // Update dispute status
    await this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: 'resolved',
        resolution: 'upheld',
        resolvedAt: new Date(),
        reVerificationResult,
      },
    });

    // Update reputation (decrease for incorrect job)
    await this.updateReputation(dispute.submitterAccountId, -10);
  }

  private async rejectDispute(disputeId: string, reVerificationResult: any) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) return;

    // Unlock funds
    await this.unlockFunds(dispute.submitterAccountId, dispute.jobId);

    // Update dispute status
    await this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: 'rejected',
        resolution: 'rejected',
        resolvedAt: new Date(),
        reVerificationResult,
      },
    });

    // Update reputation (increase for correct job)
    await this.updateReputation(dispute.submitterAccountId, 5);
  }

  private async createCompensatingEntry(dispute: any) {
    const ledgerdUrl = process.env.LEDGERD_URL || 'http://localhost:3001';
    
    await firstValueFrom(
      this.httpService.post(`${ledgerdUrl}/internal/journal/append`, {
        type: 'adjust',
        payload: {
          reason: 'dispute_upheld',
          disputeId: dispute.id,
          jobId: dispute.jobId,
          accountId: dispute.submitterAccountId,
          amount: 'negative', // This would be the actual minted amount
        },
      })
    );
  }

  private async unlockFunds(accountId: string, jobId: string) {
    const ledgerdUrl = process.env.LEDGERD_URL || 'http://localhost:3001';
    
    await firstValueFrom(
      this.httpService.post(`${ledgerdUrl}/internal/transfer`, {
        from: 'dispute-escrow',
        to: accountId,
        microAmount: '0', // This would be the actual amount
        memo: `Dispute resolved for job ${jobId}`,
      })
    );
  }

  private async updateReputation(accountId: string, delta: number) {
    // Update reputation score directly on account
    await this.prisma.account.update({
      where: { id: accountId },
      data: {
        reputationScore: { increment: delta },
      },
    });
  }

  async getDispute(disputeId: string): Promise<DisputeResponse> {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      throw new NotFoundException(`Dispute ${disputeId} not found`);
    }

    return {
      disputeId: dispute.id,
      jobId: dispute.jobId,
      status: dispute.status as any,
      reason: dispute.reason,
      evidence: dispute.evidence as Record<string, any>,
      createdAt: dispute.createdAt,
      resolvedAt: dispute.resolvedAt || undefined,
      resolution: dispute.resolution || undefined,
    };
  }

  async listDisputes(accountId?: string, status?: string) {
    const disputes = await this.prisma.dispute.findMany({
      where: {
        ...(accountId && { submitterAccountId: accountId }),
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return disputes.map(dispute => ({
      disputeId: dispute.id,
      jobId: dispute.jobId,
      status: dispute.status,
      reason: dispute.reason,
      createdAt: dispute.createdAt,
      resolvedAt: dispute.resolvedAt,
    }));
  }
}
