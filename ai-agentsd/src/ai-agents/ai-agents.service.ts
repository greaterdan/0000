import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterAgentDto } from './dto/register-agent.dto';
import { InteractAgentDto } from './dto/interact-agent.dto';
import { ReviewAgentDto } from './dto/review-agent.dto';
import { SubscribeAgentDto } from './dto/subscribe-agent.dto';
import axios from 'axios';

@Injectable()
export class AIAgentsService {
  constructor(private prisma: PrismaService) {}

  async registerAgent(userId: string, registerAgentDto: RegisterAgentDto) {
    // Calculate registration cost based on agent type and capabilities
    const registrationCost = this.calculateRegistrationCost(registerAgentDto);

    // TODO: Check if user has enough AIM tokens
    await this.checkUserBalance(userId, registrationCost);

    const agent = await this.prisma.aIAgent.create({
      data: {
        ...registerAgentDto,
        ownerId: userId,
        registrationCost: BigInt(registrationCost),
        monthlyFee: BigInt(this.calculateMonthlyFee(registerAgentDto)),
        capabilities: registerAgentDto.capabilities || [],
        tags: registerAgentDto.tags || [],
        version: registerAgentDto.version || '1.0.0',
        isPublic: registerAgentDto.isPublic ?? true,
        status: 'pending',
      },
      include: {
        owner: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });

    // TODO: Deduct registration cost from user's AIM tokens
    await this.deductAIMTokens(userId, registrationCost);

    return agent;
  }

  async findAllAgents(filters?: {
    agentType?: string;
    capabilities?: string[];
    status?: string;
    isPublic?: boolean;
    ownerId?: string;
    tags?: string[];
    minRating?: number;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.agentType) {
      where.agentType = filters.agentType;
    }

    if (filters?.capabilities && filters.capabilities.length > 0) {
      where.capabilities = {
        hasSome: filters.capabilities,
      };
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.isPublic !== undefined) {
      where.isPublic = filters.isPublic;
    }

    if (filters?.ownerId) {
      where.ownerId = filters.ownerId;
    }

    if (filters?.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    if (filters?.minRating) {
      where.reputation = {
        gte: filters.minRating,
      };
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [agents, total] = await Promise.all([
      this.prisma.aIAgent.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              displayName: true,
            },
          },
          _count: {
            select: {
              interactions: true,
              reviews: true,
              subscriptions: true,
            },
          },
        },
        orderBy: [
          { reputation: 'desc' },
          { usageCount: 'desc' },
          { createdAt: 'desc' },
        ],
        take: filters?.limit || 20,
        skip: filters?.offset || 0,
      }),
      this.prisma.aIAgent.count({ where }),
    ]);

    return {
      agents,
      total,
      limit: filters?.limit || 20,
      offset: filters?.offset || 0,
    };
  }

  async findAgentById(id: string) {
    const agent = await this.prisma.aIAgent.findUnique({
      where: { id },
      include: {
        owner: {
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
            interactions: true,
            reviews: true,
            subscriptions: true,
          },
        },
      },
    });

    if (!agent) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }

    return agent;
  }

  async interactWithAgent(userId: string, interactAgentDto: InteractAgentDto) {
    const { agentId, interactionType, input } = interactAgentDto;

    // Get agent details
    const agent = await this.prisma.aIAgent.findUnique({
      where: { id: agentId, status: 'active', isActive: true },
      include: { owner: true },
    });

    if (!agent) {
      throw new NotFoundException(`Agent with ID ${agentId} not found or inactive`);
    }

    try {
      const startTime = Date.now();

      // TODO: Call the actual agent API
      const result = await this.callAgentAPI(agent, input, interactionType);

      const duration = Date.now() - startTime;
      const tokensUsed = this.estimateTokens(input) + this.estimateTokens(result);
      const costAIM = this.calculateInteractionCost(agent, tokensUsed);

      // Create interaction record
      const interaction = await this.prisma.aIAgentInteraction.create({
        data: {
          agentId,
          userId,
          interactionType,
          input,
          output: result,
          tokensUsed,
          costAIM: BigInt(costAIM),
          duration,
          success: true,
        },
      });

      // Update agent usage count and earnings
      await this.prisma.aIAgent.update({
        where: { id: agentId },
        data: {
          usageCount: { increment: 1 },
          totalEarnings: { increment: BigInt(costAIM) },
        },
      });

      // TODO: Transfer AIM tokens from user to agent owner
      await this.transferAIMTokens(userId, agent.ownerId, costAIM);

      return {
        interactionId: interaction.id,
        result,
        costAIM,
        duration,
        tokensUsed,
      };
    } catch (error) {
      // Record failed interaction
      await this.prisma.aIAgentInteraction.create({
        data: {
          agentId,
          userId,
          interactionType,
          input,
          duration: 0,
          success: false,
          errorMessage: error.message,
        },
      });

      throw new BadRequestException(`Agent interaction failed: ${error.message}`);
    }
  }

  async reviewAgent(userId: string, reviewAgentDto: ReviewAgentDto) {
    const { agentId, rating, comment, performance, reliability, easeOfUse, valueForMoney } = reviewAgentDto;

    // Check if agent exists
    const agent = await this.prisma.aIAgent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new NotFoundException(`Agent with ID ${agentId} not found`);
    }

    // Check if user has interacted with this agent
    const interaction = await this.prisma.aIAgentInteraction.findFirst({
      where: {
        userId,
        agentId,
        success: true,
      },
    });

    if (!interaction) {
      throw new BadRequestException('You must interact with this agent before reviewing it');
    }

    // Create or update review
    const review = await this.prisma.aIAgentReview.upsert({
      where: {
        userId_agentId: {
          userId,
          agentId,
        },
      },
      update: {
        rating,
        comment,
        performance,
        reliability,
        easeOfUse,
        valueForMoney,
      },
      create: {
        userId,
        agentId,
        rating,
        comment,
        performance,
        reliability,
        easeOfUse,
        valueForMoney,
      },
    });

    // Update agent average reputation
    const reviews = await this.prisma.aIAgentReview.findMany({
      where: { agentId },
      select: { rating: true },
    });

    const avgReputation = reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length;

    await this.prisma.aIAgent.update({
      where: { id: agentId },
      data: { reputation: avgReputation },
    });

    return review;
  }

  async subscribeToAgent(userId: string, subscribeAgentDto: SubscribeAgentDto) {
    const { agentId, plan, usageLimit, autoRenew = true } = subscribeAgentDto;

    // Get agent details
    const agent = await this.prisma.aIAgent.findUnique({
      where: { id: agentId, status: 'active' },
      include: { owner: true },
    });

    if (!agent) {
      throw new NotFoundException(`Agent with ID ${agentId} not found or inactive`);
    }

    // Check if user already has a subscription
    const existingSubscription = await this.prisma.aIAgentSubscription.findFirst({
      where: {
        userId,
        agentId,
        status: 'active',
      },
    });

    if (existingSubscription) {
      throw new BadRequestException('You already have an active subscription to this agent');
    }

    const monthlyFee = this.calculateSubscriptionFee(plan, usageLimit);

    // TODO: Check if user has enough AIM tokens for monthly fee
    await this.checkUserBalance(userId, monthlyFee);

    const subscription = await this.prisma.aIAgentSubscription.create({
      data: {
        agentId,
        userId,
        plan,
        monthlyFee: BigInt(monthlyFee),
        usageLimit: usageLimit || this.getDefaultUsageLimit(plan),
        currentUsage: 0,
        status: 'active',
        autoRenew,
      },
    });

    // TODO: Deduct first month's fee
    await this.deductAIMTokens(userId, monthlyFee);

    return subscription;
  }

  async getUserAgents(userId: string) {
    return this.prisma.aIAgent.findMany({
      where: { ownerId: userId },
      include: {
        _count: {
          select: {
            interactions: true,
            reviews: true,
            subscriptions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserInteractions(userId: string, limit = 20, offset = 0) {
    const [interactions, total] = await Promise.all([
      this.prisma.aIAgentInteraction.findMany({
        where: { userId },
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              agentType: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.aIAgentInteraction.count({ where: { userId } }),
    ]);

    return {
      interactions,
      total,
      limit,
      offset,
    };
  }

  async getUserSubscriptions(userId: string) {
    return this.prisma.aIAgentSubscription.findMany({
      where: { userId, status: 'active' },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            agentType: true,
            reputation: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private calculateRegistrationCost(agentData: RegisterAgentDto): number {
    let baseCost = 100; // Base registration cost in AIM tokens

    // Agent type multipliers
    const typeMultipliers = {
      'service': 1.0,
      'tool': 0.5,
      'model': 2.0,
      'assistant': 1.5,
    };

    // Capability multipliers
    const capabilityCost = agentData.capabilities.length * 10;

    return Math.ceil(baseCost * typeMultipliers[agentData.agentType] + capabilityCost);
  }

  private calculateMonthlyFee(agentData: RegisterAgentDto): number {
    let baseFee = 50; // Base monthly fee in AIM tokens

    const typeMultipliers = {
      'service': 1.0,
      'tool': 0.3,
      'model': 1.5,
      'assistant': 1.2,
    };

    return Math.ceil(baseFee * typeMultipliers[agentData.agentType]);
  }

  private calculateInteractionCost(agent: any, tokensUsed: number): number {
    // Base cost per token
    const baseCostPerToken = 0.001; // AIM tokens per token

    // Agent reputation multiplier (better reputation = higher cost)
    const reputationMultiplier = Math.max(0.5, Math.min(2.0, Number(agent.reputation) / 2.5));

    return Math.ceil(tokensUsed * baseCostPerToken * reputationMultiplier);
  }

  private calculateSubscriptionFee(plan: string, usageLimit?: number): number {
    const planBaseFees = {
      'basic': 100,
      'premium': 500,
      'enterprise': 2000,
    };

    let fee = planBaseFees[plan] || 100;

    // Add usage-based pricing
    if (usageLimit) {
      fee += Math.ceil(usageLimit * 0.01); // 0.01 AIM per usage unit
    }

    return fee;
  }

  private getDefaultUsageLimit(plan: string): number {
    const planLimits = {
      'basic': 100,
      'premium': 1000,
      'enterprise': 10000,
    };

    return planLimits[plan] || 100;
  }

  private async callAgentAPI(agent: any, input: any, interactionType: string): Promise<any> {
    // TODO: Implement actual agent API call
    // For now, simulate the interaction
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

    return {
      result: `Agent ${agent.name} processed: ${JSON.stringify(input)}`,
      type: interactionType,
      agentId: agent.id,
      timestamp: new Date().toISOString(),
    };
  }

  private estimateTokens(data: any): number {
    // Simple token estimation
    const text = JSON.stringify(data);
    return Math.ceil(text.length / 4); // Rough estimate: 4 characters per token
  }

  private async checkUserBalance(userId: string, costAIM: number): Promise<void> {
    // TODO: Integrate with AIM currency system
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

  private async deductAIMTokens(userId: string, amount: number): Promise<void> {
    // TODO: Integrate with AIM currency system
    try {
      const gatewayUrl = process.env.GATEWAY_URL || 'http://localhost:3000';
      await axios.post(`${gatewayUrl}/api/v1/transfer`, {
        to: 'treasury', // Platform treasury
        microAmount: amount * 1000000, // Convert to microAIM
        memo: 'AI Agent Registration/Monthly Fee',
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_TOKEN}`,
        },
      });
    } catch (error) {
      console.error('Failed to deduct AIM tokens:', error.message);
    }
  }

  private async transferAIMTokens(fromUserId: string, toUserId: string, amount: number): Promise<void> {
    // TODO: Integrate with AIM currency system
    try {
      const gatewayUrl = process.env.GATEWAY_URL || 'http://localhost:3000';
      await axios.post(`${gatewayUrl}/api/v1/transfer`, {
        to: toUserId,
        microAmount: amount * 1000000, // Convert to microAIM
        memo: 'AI Agent Interaction Payment',
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_TOKEN}`,
        },
      });
    } catch (error) {
      console.error('Failed to transfer AIM tokens:', error.message);
    }
  }
}
