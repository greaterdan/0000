import { Injectable, OnModuleInit } from '@nestjs/common';
import { JobService } from './job/job.service';
import { VerifierService } from './verifier/verifier.service';
import { LedgerService } from './ledger/ledger.service';
import { NatsService } from './nats/nats.service';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class MintOrchestratorService implements OnModuleInit {
  constructor(
    private jobService: JobService,
    private verifierService: VerifierService,
    private ledgerService: LedgerService,
    private natsService: NatsService,
    private prisma: PrismaService,
  ) {}

  async onModuleInit() {
    // Subscribe to job.scored events
    await this.natsService.subscribeToJobScored(async (event) => {
      await this.handleJobScored(event);
    });
  }

  private async handleJobScored(event: { jobId: string; score: number; report: Record<string, any>; timestamp: number }) {
    console.log(`Processing scored job ${event.jobId} with score ${event.score}`);

    try {
      // Get mint threshold from policy
      const mintThresholdPolicy = await this.prisma.policy.findUnique({
        where: { key: 'mint.threshold' },
      });

      const mintThreshold = mintThresholdPolicy ? parseFloat(mintThresholdPolicy.value.toString()) : 0.85;

      // Get mint curve base amount
      const mintBasePolicy = await this.prisma.policy.findUnique({
        where: { key: 'mint.curve.base' },
      });

      const mintBaseAmount = mintBasePolicy ? parseInt(mintBasePolicy.value.toString()) : 100000;

      // Check if score meets threshold
      if (event.score >= mintThreshold) {
        // Calculate mint amount
        const mintAmount = this.ledgerService.calculateMintAmount(
          event.score,
          mintBaseAmount,
          mintThreshold
        );

        // Get job details
        const job = await this.jobService.getJob(event.jobId);

        // Mint to the submitter account
        const mintResponse = await this.ledgerService.mint({
          accountId: job.submitterAccountId,
          microAmount: mintAmount,
          jobId: event.jobId,
          reason: 'ai_job_completion',
        });

        // Mark job as minted
        await this.jobService.markJobAsMinted(event.jobId, mintResponse.transactionId);

        // Publish mint.ready event
        await this.natsService.publishMintReady({
          jobId: event.jobId,
          accountId: job.submitterAccountId,
          microAmount: mintAmount,
          timestamp: Date.now(),
        });

        console.log(`Successfully minted ${mintAmount} microAIM for job ${event.jobId}`);
      } else {
        // Mark job as rejected
        await this.jobService.markJobAsRejected(
          event.jobId,
          `Score ${event.score} below threshold ${mintThreshold}`
        );

        console.log(`Job ${event.jobId} rejected due to low score: ${event.score}`);
      }
    } catch (error) {
      console.error(`Error processing scored job ${event.jobId}:`, error);
      
      // Mark job as rejected due to error
      await this.jobService.markJobAsRejected(
        event.jobId,
        `Processing error: ${error.message}`
      );
    }
  }
}
