import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateModelDto } from './dto/create-model.dto';
import { UseModelDto } from './dto/use-model.dto';
import { ReviewModelDto } from './dto/review-model.dto';
import axios from 'axios';

@Injectable()
export class AIModelsService {
  constructor(private prisma: PrismaService) {}

  async createModel(userId: string, createModelDto: CreateModelDto) {
    return this.prisma.aIModel.create({
      data: {
        ...createModelDto,
        creatorId: userId,
        version: createModelDto.version || '1.0.0',
        isPublic: createModelDto.isPublic ?? true,
        tags: createModelDto.tags || [],
      },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });
  }

  async findAllModels(filters?: {
    modelType?: string;
    tags?: string[];
    isPublic?: boolean;
    creatorId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.modelType) {
      where.modelType = filters.modelType;
    }

    if (filters?.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    if (filters?.isPublic !== undefined) {
      where.isPublic = filters.isPublic;
    }

    if (filters?.creatorId) {
      where.creatorId = filters.creatorId;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [models, total] = await Promise.all([
      this.prisma.aIModel.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              displayName: true,
            },
          },
          _count: {
            select: {
              usages: true,
              reviews: true,
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
      this.prisma.aIModel.count({ where }),
    ]);

    return {
      models,
      total,
      limit: filters?.limit || 20,
      offset: filters?.offset || 0,
    };
  }

  async findModelById(id: string) {
    const model = await this.prisma.aIModel.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            usages: true,
            reviews: true,
          },
        },
      },
    });

    if (!model) {
      throw new NotFoundException(`Model with ID ${id} not found`);
    }

    return model;
  }

  async useModel(userId: string, useModelDto: UseModelDto) {
    const { modelId, input, maxTokens = 1000, temperature = 0.7, parameters = {} } = useModelDto;

    // Get model details
    const model = await this.prisma.aIModel.findUnique({
      where: { id: modelId, isActive: true },
      include: { creator: true },
    });

    if (!model) {
      throw new NotFoundException(`Model with ID ${modelId} not found or inactive`);
    }

    // Calculate cost based on input size and max tokens
    const inputTokens = this.estimateTokens(input);
    const totalTokens = inputTokens + maxTokens;
    const costAIM = Math.ceil(totalTokens * Number(model.costPerToken));

    try {
      // TODO: Integrate with actual AI model inference
      // For now, we'll simulate the inference
      const startTime = Date.now();
      const result = await this.simulateModelInference(model, input, maxTokens, temperature, parameters);
      const duration = Date.now() - startTime;

      // Create usage record
      const usage = await this.prisma.aIModelUsage.create({
        data: {
          userId,
          modelId,
          tokensUsed: totalTokens,
          costAIM: BigInt(costAIM),
          inputSize: JSON.stringify(input).length,
          outputSize: JSON.stringify(result).length,
          duration,
          success: true,
        },
      });

      // Update model usage count and earnings
      await this.prisma.aIModel.update({
        where: { id: modelId },
        data: {
          usageCount: { increment: 1 },
          totalEarnings: { increment: BigInt(costAIM) },
        },
      });

      // TODO: Transfer AIM tokens from user to model creator and platform
      // This would integrate with the main AIM currency system
      await this.transferAIMTokens(userId, model.creatorId, costAIM);

      return {
        result,
        usage: {
          tokensUsed: totalTokens,
          costAIM,
          duration,
          usageId: usage.id,
        },
      };
    } catch (error) {
      // Record failed usage
      await this.prisma.aIModelUsage.create({
        data: {
          userId,
          modelId,
          tokensUsed: 0,
          costAIM: BigInt(0),
          inputSize: JSON.stringify(input).length,
          outputSize: 0,
          duration: 0,
          success: false,
          errorMessage: error.message,
        },
      });

      throw new BadRequestException(`Model inference failed: ${error.message}`);
    }
  }

  async reviewModel(userId: string, reviewModelDto: ReviewModelDto) {
    const { modelId, rating, comment } = reviewModelDto;

    // Check if model exists
    const model = await this.prisma.aIModel.findUnique({
      where: { id: modelId },
    });

    if (!model) {
      throw new NotFoundException(`Model with ID ${modelId} not found`);
    }

    // Create or update review
    const review = await this.prisma.aIModelReview.upsert({
      where: {
        userId_modelId: {
          userId,
          modelId,
        },
      },
      update: {
        rating,
        comment,
      },
      create: {
        userId,
        modelId,
        rating,
        comment,
      },
    });

    // Update model average rating
    const reviews = await this.prisma.aIModelReview.findMany({
      where: { modelId },
      select: { rating: true },
    });

    const avgRating = reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length;

    await this.prisma.aIModel.update({
      where: { id: modelId },
      data: { rating: avgRating },
    });

    return review;
  }

  async getUserModels(userId: string) {
    return this.prisma.aIModel.findMany({
      where: { creatorId: userId },
      include: {
        _count: {
          select: {
            usages: true,
            reviews: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserUsage(userId: string, limit = 20, offset = 0) {
    const [usages, total] = await Promise.all([
      this.prisma.aIModelUsage.findMany({
        where: { userId },
        include: {
          model: {
            select: {
              id: true,
              name: true,
              modelType: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.aIModelUsage.count({ where: { userId } }),
    ]);

    return {
      usages,
      total,
      limit,
      offset,
    };
  }

  private estimateTokens(input: any): number {
    // Simple token estimation - in production, use a proper tokenizer
    const text = JSON.stringify(input);
    return Math.ceil(text.length / 4); // Rough estimate: 4 characters per token
  }

  private async simulateModelInference(
    model: any,
    input: any,
    maxTokens: number,
    temperature: number,
    parameters: any
  ): Promise<any> {
    // Simulate AI model inference
    // In production, this would call the actual AI model
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

    const modelType = model.modelType;
    
    switch (modelType) {
      case 'text':
        return {
          text: `Generated response for: ${JSON.stringify(input)}`,
          tokens: Math.floor(Math.random() * maxTokens) + 10,
          finishReason: 'stop',
        };
      
      case 'image':
        return {
          imageUrl: `https://generated-image.example.com/${Date.now()}.png`,
          prompt: input.prompt || 'Generated image',
          tokens: Math.floor(Math.random() * maxTokens) + 50,
        };
      
      case 'audio':
        return {
          audioUrl: `https://generated-audio.example.com/${Date.now()}.mp3`,
          text: input.text || 'Generated audio',
          duration: Math.random() * 30 + 5, // 5-35 seconds
          tokens: Math.floor(Math.random() * maxTokens) + 100,
        };
      
      default:
        return {
          result: `Generated ${modelType} content for: ${JSON.stringify(input)}`,
          tokens: Math.floor(Math.random() * maxTokens) + 20,
        };
    }
  }

  private async transferAIMTokens(fromUserId: string, toUserId: string, amount: number) {
    // TODO: Integrate with the main AIM currency system
    // This would call the Gateway service to transfer tokens
    try {
      const gatewayUrl = process.env.GATEWAY_URL || 'http://localhost:3000';
      await axios.post(`${gatewayUrl}/api/v1/transfer`, {
        to: toUserId,
        microAmount: amount * 1000000, // Convert to microAIM
        memo: 'AI Model Usage Payment',
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
