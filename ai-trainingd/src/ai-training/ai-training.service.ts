import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTrainingJobDto } from './dto/create-training-job.dto';
import { CreateDatasetDto } from './dto/create-dataset.dto';
import axios from 'axios';

@Injectable()
export class AITrainingService {
  constructor(private prisma: PrismaService) {}

  async createTrainingJob(userId: string, createTrainingJobDto: CreateTrainingJobDto) {
    // Calculate estimated cost based on model type, architecture, and dataset size
    const costAIM = await this.calculateTrainingCost(createTrainingJobDto);
    
    // TODO: Check if user has enough AIM tokens
    await this.checkUserBalance(userId, costAIM);

    const job = await this.prisma.aITrainingJob.create({
      data: {
        ...createTrainingJobDto,
        userId,
        costAIM: BigInt(costAIM),
        status: 'pending',
        progress: 0.0,
      },
    });

    // Add to training queue
    await this.addToTrainingQueue(job.id, createTrainingJobDto.priority || 5);

    return job;
  }

  async getTrainingJobs(userId?: string, filters?: {
    status?: string;
    modelType?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    
    if (userId) {
      where.userId = userId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.modelType) {
      where.modelType = filters.modelType;
    }

    const [jobs, total] = await Promise.all([
      this.prisma.aITrainingJob.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 20,
        skip: filters?.offset || 0,
      }),
      this.prisma.aITrainingJob.count({ where }),
    ]);

    return {
      jobs,
      total,
      limit: filters?.limit || 20,
      offset: filters?.offset || 0,
    };
  }

  async getTrainingJobById(id: string) {
    const job = await this.prisma.aITrainingJob.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException(`Training job with ID ${id} not found`);
    }

    return job;
  }

  async cancelTrainingJob(userId: string, jobId: string) {
    const job = await this.prisma.aITrainingJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException(`Training job with ID ${jobId} not found`);
    }

    if (job.userId !== userId) {
      throw new BadRequestException('You can only cancel your own training jobs');
    }

    if (job.status === 'completed' || job.status === 'failed') {
      throw new BadRequestException('Cannot cancel completed or failed jobs');
    }

    // Update job status
    const updatedJob = await this.prisma.aITrainingJob.update({
      where: { id: jobId },
      data: {
        status: 'cancelled',
        completedAt: new Date(),
      },
    });

    // Remove from queue if still queued
    await this.removeFromTrainingQueue(jobId);

    // TODO: Refund partial AIM tokens if job was running
    if (job.status === 'running') {
      await this.refundPartialCost(userId, jobId);
    }

    return updatedJob;
  }

  async createDataset(userId: string, createDatasetDto: CreateDatasetDto) {
    return this.prisma.aITrainingDataset.create({
      data: {
        ...createDatasetDto,
        userId,
        usageCount: 0,
        tags: createDatasetDto.tags || [],
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });
  }

  async getDatasets(filters?: {
    dataType?: string;
    isPublic?: boolean;
    userId?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.dataType) {
      where.dataType = filters.dataType;
    }

    if (filters?.isPublic !== undefined) {
      where.isPublic = filters.isPublic;
    }

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    const [datasets, total] = await Promise.all([
      this.prisma.aITrainingDataset.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
            },
          },
          _count: {
            select: {
              trainingJobs: true,
            },
          },
        },
        orderBy: [
          { rating: 'desc' },
          { usageCount: 'desc' },
          { createdAt: 'desc' },
        ],
        take: filters?.limit || 20,
        skip: filters?.offset || 0,
      }),
      this.prisma.aITrainingDataset.count({ where }),
    ]);

    return {
      datasets,
      total,
      limit: filters?.limit || 20,
      offset: filters?.offset || 0,
    };
  }

  async getDatasetById(id: string) {
    const dataset = await this.prisma.aITrainingDataset.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
          },
        },
        _count: {
          select: {
            trainingJobs: true,
          },
        },
      },
    });

    if (!dataset) {
      throw new NotFoundException(`Dataset with ID ${id} not found`);
    }

    return dataset;
  }

  async getTrainingQueue() {
    return this.prisma.aITrainingQueue.findMany({
      include: {
        job: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
        resource: true,
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
    });
  }

  async getTrainingResources() {
    return this.prisma.aITrainingResource.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  private async calculateTrainingCost(jobData: CreateTrainingJobDto): Promise<number> {
    // Calculate cost based on various factors
    let baseCost = 1000; // Base cost in AIM tokens

    // Model type multipliers
    const typeMultipliers = {
      'text': 1.0,
      'image': 2.0,
      'audio': 1.5,
      'video': 3.0,
      'multimodal': 2.5,
    };

    // Architecture multipliers
    const archMultipliers = {
      'transformer': 1.5,
      'cnn': 1.0,
      'rnn': 1.2,
      'lstm': 1.3,
      'gru': 1.1,
      'gan': 2.0,
      'vae': 1.8,
      'diffusion': 2.5,
    };

    const typeMultiplier = typeMultipliers[jobData.modelType] || 1.0;
    const archMultiplier = archMultipliers[jobData.architecture] || 1.0;

    // Hyperparameter factors
    const epochs = jobData.hyperparameters.epochs || 10;
    const batchSize = jobData.hyperparameters.batchSize || 32;

    const cost = Math.ceil(
      baseCost * 
      typeMultiplier * 
      archMultiplier * 
      (epochs / 10) * 
      (batchSize / 32)
    );

    return cost;
  }

  private async checkUserBalance(userId: string, costAIM: number): Promise<void> {
    // TODO: Integrate with the main AIM currency system to check balance
    // This would call the Gateway service to check user balance
    try {
      const gatewayUrl = process.env.GATEWAY_URL || 'http://localhost:3000';
      const response = await axios.get(`${gatewayUrl}/api/v1/balance`, {
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_TOKEN}`,
        },
        params: { userId },
      });

      const balance = response.data.balance;
      if (balance < costAIM) {
        throw new BadRequestException(`Insufficient AIM tokens. Required: ${costAIM}, Available: ${balance}`);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        throw new BadRequestException('User account not found');
      }
      throw new BadRequestException(`Failed to check balance: ${error.message}`);
    }
  }

  private async addToTrainingQueue(jobId: string, priority: number): Promise<void> {
    const estimatedStart = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    await this.prisma.aITrainingQueue.create({
      data: {
        jobId,
        priority,
        estimatedStart,
        status: 'queued',
      },
    });
  }

  private async removeFromTrainingQueue(jobId: string): Promise<void> {
    await this.prisma.aITrainingQueue.deleteMany({
      where: { jobId, status: 'queued' },
    });
  }

  private async refundPartialCost(userId: string, jobId: string): Promise<void> {
    // TODO: Implement partial refund logic
    // This would calculate how much to refund based on training progress
    // and transfer tokens back to the user
  }

  // Training job processor (would be called by background worker)
  async processTrainingJob(jobId: string): Promise<void> {
    const job = await this.prisma.aITrainingJob.findUnique({
      where: { id: jobId },
    });

    if (!job || job.status !== 'pending') {
      return;
    }

    try {
      // Update job status to running
      await this.prisma.aITrainingJob.update({
        where: { id: jobId },
        data: {
          status: 'running',
          startedAt: new Date(),
        },
      });

      // TODO: Implement actual training logic
      // This would:
      // 1. Download dataset
      // 2. Set up training environment
      // 3. Run training process
      // 4. Upload trained model
      // 5. Update job with results

      // Simulate training process
      await this.simulateTrainingProcess(jobId);

      // Mark job as completed
      await this.prisma.aITrainingJob.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          progress: 1.0,
          completedAt: new Date(),
          modelUrl: `https://models.example.com/trained/${jobId}`,
          metrics: {
            finalLoss: 0.1234,
            accuracy: 0.9876,
            trainingTime: 3600, // seconds
          },
        },
      });

      // TODO: Pay user for completed training job
      await this.payTrainingReward(job.userId, jobId);

    } catch (error) {
      // Mark job as failed
      await this.prisma.aITrainingJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          errorMessage: error.message,
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }

  private async simulateTrainingProcess(jobId: string): Promise<void> {
    // Simulate training progress updates
    const totalSteps = 100;
    
    for (let step = 1; step <= totalSteps; step++) {
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms per step
      
      const progress = step / totalSteps;
      
      await this.prisma.aITrainingJob.update({
        where: { id: jobId },
        data: {
          progress,
          logs: {
            push: `Training step ${step}/${totalSteps} completed`,
          },
        },
      });
    }
  }

  private async payTrainingReward(userId: string, jobId: string): Promise<void> {
    // TODO: Integrate with AIM currency system to pay training rewards
    // This would transfer AIM tokens to the user for completing the training job
  }
}
