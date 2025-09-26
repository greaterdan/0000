import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InferenceRequestDto } from './dto/inference-request.dto';
import axios from 'axios';

@Injectable()
export class AIInferenceService {
  constructor(private prisma: PrismaService) {}

  async createInferenceRequest(userId: string, inferenceRequestDto: InferenceRequestDto) {
    const { modelId, requestType, input, sessionId, sessionName, ...parameters } = inferenceRequestDto;

    // Get or create session
    let session;
    if (sessionId) {
      session = await this.prisma.aIInferenceSession.findUnique({
        where: { id: sessionId, userId },
      });
      if (!session) {
        throw new NotFoundException(`Session with ID ${sessionId} not found`);
      }
    } else {
      session = await this.prisma.aIInferenceSession.create({
        data: {
          userId,
          modelId,
          sessionName: sessionName || `Inference Session ${new Date().toISOString()}`,
          status: 'active',
        },
      });
    }

    // Create inference request
    const request = await this.prisma.aIInferenceRequest.create({
      data: {
        sessionId: session.id,
        userId,
        modelId,
        requestType,
        input,
        status: 'pending',
        parameters,
      },
    });

    // Process inference request asynchronously
    this.processInferenceRequest(request.id).catch(error => {
      console.error(`Failed to process inference request ${request.id}:`, error);
    });

    return {
      requestId: request.id,
      sessionId: session.id,
      status: 'pending',
      estimatedCost: await this.estimateCost(modelId, input, parameters),
    };
  }

  async getInferenceRequest(requestId: string) {
    const request = await this.prisma.aIInferenceRequest.findUnique({
      where: { id: requestId },
      include: {
        session: true,
      },
    });

    if (!request) {
      throw new NotFoundException(`Inference request with ID ${requestId} not found`);
    }

    return request;
  }

  async getInferenceSession(sessionId: string, userId?: string) {
    const where: any = { id: sessionId };
    if (userId) {
      where.userId = userId;
    }

    const session = await this.prisma.aIInferenceSession.findUnique({
      where,
      include: {
        requests: {
          orderBy: { createdAt: 'desc' },
          take: 50, // Last 50 requests
        },
        user: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Inference session with ID ${sessionId} not found`);
    }

    return session;
  }

  async getUserSessions(userId: string, filters?: {
    status?: string;
    modelId?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = { userId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.modelId) {
      where.modelId = filters.modelId;
    }

    const [sessions, total] = await Promise.all([
      this.prisma.aIInferenceSession.findMany({
        where,
        include: {
          _count: {
            select: {
              requests: true,
            },
          },
        },
        orderBy: { lastUsedAt: 'desc' },
        take: filters?.limit || 20,
        skip: filters?.offset || 0,
      }),
      this.prisma.aIInferenceSession.count({ where }),
    ]);

    return {
      sessions,
      total,
      limit: filters?.limit || 20,
      offset: filters?.offset || 0,
    };
  }

  async getInferenceMetrics(modelId?: string, dateRange?: { start: Date; end: Date }) {
    const where: any = {};

    if (modelId) {
      where.modelId = modelId;
    }

    if (dateRange) {
      where.date = {
        gte: dateRange.start,
        lte: dateRange.end,
      };
    }

    return this.prisma.aIInferenceMetrics.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  async getModelEndpoints(modelId?: string) {
    const where: any = {};

    if (modelId) {
      where.modelId = modelId;
    }

    return this.prisma.aIModelEndpoint.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  private async processInferenceRequest(requestId: string): Promise<void> {
    const request = await this.prisma.aIInferenceRequest.findUnique({
      where: { id: requestId },
      include: { session: true },
    });

    if (!request || request.status !== 'pending') {
      return;
    }

    try {
      // Update status to processing
      await this.prisma.aIInferenceRequest.update({
        where: { id: requestId },
        data: { status: 'processing' },
      });

      const startTime = Date.now();

      // TODO: Integrate with actual AI model inference
      // For now, we'll simulate the inference
      const result = await this.simulateInference(request);

      const latency = Date.now() - startTime;
      const tokensUsed = this.estimateTokens(request.input) + this.estimateTokens(result);
      const costAIM = await this.calculateCost(request.modelId, tokensUsed);

      // Update request with results
      await this.prisma.aIInferenceRequest.update({
        where: { id: requestId },
        data: {
          status: 'completed',
          output: result,
          tokensUsed,
          costAIM: BigInt(costAIM),
          latency,
          completedAt: new Date(),
        },
      });

      // Update session statistics
      await this.updateSessionStats(request.sessionId, tokensUsed, costAIM, latency);

      // TODO: Transfer AIM tokens from user to model provider
      await this.transferAIMTokens(request.userId, request.modelId, costAIM);

      // Update daily metrics
      await this.updateDailyMetrics(request.modelId, tokensUsed, costAIM, latency, true);

    } catch (error) {
      // Mark request as failed
      await this.prisma.aIInferenceRequest.update({
        where: { id: requestId },
        data: {
          status: 'failed',
          errorMessage: error.message,
          completedAt: new Date(),
        },
      });

      // Update daily metrics for failed request
      await this.updateDailyMetrics(request.modelId, 0, 0, 0, false);

      throw error;
    }
  }

  private async simulateInference(request: any): Promise<any> {
    // Simulate AI model inference
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));

    const requestType = request.requestType;
    const input = request.input;

    switch (requestType) {
      case 'text':
        return {
          text: `AI Response: ${JSON.stringify(input)}`,
          tokens: Math.floor(Math.random() * 100) + 50,
          finishReason: 'stop',
        };

      case 'image':
        return {
          imageUrl: `https://generated-image.example.com/${Date.now()}.png`,
          prompt: input.prompt || 'Generated image',
          tokens: Math.floor(Math.random() * 200) + 100,
        };

      case 'audio':
        return {
          audioUrl: `https://generated-audio.example.com/${Date.now()}.mp3`,
          text: input.text || 'Generated audio',
          duration: Math.random() * 30 + 5,
          tokens: Math.floor(Math.random() * 150) + 75,
        };

      case 'video':
        return {
          videoUrl: `https://generated-video.example.com/${Date.now()}.mp4`,
          prompt: input.prompt || 'Generated video',
          duration: Math.random() * 60 + 10,
          tokens: Math.floor(Math.random() * 500) + 200,
        };

      default:
        return {
          result: `Generated ${requestType} content for: ${JSON.stringify(input)}`,
          tokens: Math.floor(Math.random() * 100) + 25,
        };
    }
  }

  private async estimateCost(modelId: string, input: any, parameters?: any): Promise<number> {
    // TODO: Get actual model pricing from AI Model Marketplace
    // For now, use a simple estimation
    const inputTokens = this.estimateTokens(input);
    const maxTokens = parameters?.maxTokens || 1000;
    const costPerToken = 0.001; // Base cost in AIM tokens per token

    return Math.ceil((inputTokens + maxTokens) * costPerToken);
  }

  private async calculateCost(modelId: string, tokensUsed: number): Promise<number> {
    // TODO: Get actual model pricing from AI Model Marketplace
    const costPerToken = 0.001; // Base cost in AIM tokens per token
    return Math.ceil(tokensUsed * costPerToken);
  }

  private estimateTokens(data: any): number {
    // Simple token estimation - in production, use a proper tokenizer
    const text = JSON.stringify(data);
    return Math.ceil(text.length / 4); // Rough estimate: 4 characters per token
  }

  private async updateSessionStats(sessionId: string, tokensUsed: number, costAIM: number, latency: number): Promise<void> {
    const session = await this.prisma.aIInferenceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) return;

    const newTotalRequests = session.totalRequests + 1;
    const newTotalTokens = session.totalTokens + tokensUsed;
    const newTotalCost = session.totalCostAIM + BigInt(costAIM);
    const newAverageLatency = session.averageLatency 
      ? (session.averageLatency * session.totalRequests + latency) / newTotalRequests
      : latency;

    await this.prisma.aIInferenceSession.update({
      where: { id: sessionId },
      data: {
        totalRequests: newTotalRequests,
        totalTokens: newTotalTokens,
        totalCostAIM: newTotalCost,
        averageLatency: newAverageLatency,
        lastUsedAt: new Date(),
      },
    });
  }

  private async updateDailyMetrics(modelId: string, tokensUsed: number, costAIM: number, latency: number, success: boolean): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.aIInferenceMetrics.upsert({
      where: {
        modelId_date: {
          modelId,
          date: today,
        },
      },
      update: {
        totalRequests: { increment: 1 },
        successfulRequests: success ? { increment: 1 } : undefined,
        failedRequests: success ? undefined : { increment: 1 },
        totalTokens: { increment: tokensUsed },
        totalCostAIM: { increment: BigInt(costAIM) },
        // Update average latency
        averageLatency: undefined, // TODO: Calculate proper average
      },
      create: {
        modelId,
        date: today,
        totalRequests: 1,
        successfulRequests: success ? 1 : 0,
        failedRequests: success ? 0 : 1,
        averageLatency: latency,
        totalTokens: tokensUsed,
        totalCostAIM: BigInt(costAIM),
        peakConcurrency: 1, // TODO: Track actual concurrency
      },
    });
  }

  private async transferAIMTokens(fromUserId: string, modelId: string, amount: number): Promise<void> {
    // TODO: Integrate with the main AIM currency system
    // This would call the Gateway service to transfer tokens
    try {
      const gatewayUrl = process.env.GATEWAY_URL || 'http://localhost:3000';
      
      // Get model creator ID from AI Model Marketplace
      const marketplaceUrl = process.env.AI_MARKETPLACE_URL || 'http://localhost:3015';
      const modelResponse = await axios.get(`${marketplaceUrl}/api/v1/models/${modelId}`);
      const modelCreatorId = modelResponse.data.creatorId;

      await axios.post(`${gatewayUrl}/api/v1/transfer`, {
        to: modelCreatorId,
        microAmount: amount * 1000000, // Convert to microAIM
        memo: 'AI Inference Payment',
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_TOKEN}`,
        },
      });
    } catch (error) {
      console.error('Failed to transfer AIM tokens:', error.message);
      // In production, you might want to handle this more gracefully
    }
  }
}
