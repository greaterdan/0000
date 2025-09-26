import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, NatsConnection, JSONCodec } from 'nats';

export interface JobSubmittedEvent {
  jobId: string;
  submitterAccountId: string;
  inputsHash: string;
  spec: Record<string, any>;
  attestation?: Record<string, any>;
  timestamp: number;
}

export interface JobScoredEvent {
  jobId: string;
  score: number;
  report: Record<string, any>;
  timestamp: number;
}

export interface MintReadyEvent {
  jobId: string;
  accountId: string;
  microAmount: string;
  timestamp: number;
}

@Injectable()
export class NatsService implements OnModuleInit, OnModuleDestroy {
  private connection: NatsConnection;
  private jsonCodec = JSONCodec();

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const natsUrl = this.configService.get('NATS_URL', 'nats://nats:4222');
    
    try {
      this.connection = await connect({
        servers: natsUrl,
      });
      console.log('Connected to NATS');
    } catch (error) {
      console.error('Failed to connect to NATS:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.connection) {
      await this.connection.close();
    }
  }

  async publishJobSubmitted(event: JobSubmittedEvent): Promise<void> {
    if (!this.connection) {
      throw new Error('NATS connection not available');
    }

    const subject = 'job.submitted';
    const data = this.jsonCodec.encode(event);
    
    this.connection.publish(subject, data);
    console.log(`Published job.submitted event for job ${event.jobId}`);
  }

  async publishJobScored(event: JobScoredEvent): Promise<void> {
    if (!this.connection) {
      throw new Error('NATS connection not available');
    }

    const subject = 'job.scored';
    const data = this.jsonCodec.encode(event);
    
    this.connection.publish(subject, data);
    console.log(`Published job.scored event for job ${event.jobId}`);
  }

  async publishMintReady(event: MintReadyEvent): Promise<void> {
    if (!this.connection) {
      throw new Error('NATS connection not available');
    }

    const subject = 'mint.ready';
    const data = this.jsonCodec.encode(event);
    
    this.connection.publish(subject, data);
    console.log(`Published mint.ready event for job ${event.jobId}`);
  }

  async subscribeToJobScored(callback: (event: JobScoredEvent) => Promise<void>): Promise<void> {
    if (!this.connection) {
      throw new Error('NATS connection not available');
    }

    const subscription = this.connection.subscribe('job.scored');
    
    (async () => {
      for await (const message of subscription) {
        try {
          const event = this.jsonCodec.decode(message.data) as JobScoredEvent;
          await callback(event);
        } catch (error) {
          console.error('Error processing job.scored event:', error);
        }
      }
    })();
  }
}
