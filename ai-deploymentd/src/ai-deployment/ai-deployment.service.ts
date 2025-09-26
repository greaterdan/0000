import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeployModelDto } from './dto/deploy-model.dto';
import { ModelRequestDto } from './dto/model-request.dto';
import { CreateDeploymentTemplateDto } from './dto/create-template.dto';
import axios from 'axios';

@Injectable()
export class AIDeploymentService {
  constructor(private prisma: PrismaService) {}

  async deployModel(userId: string, deployModelDto: DeployModelDto) {
    const { modelId, name, description, deploymentType, environment = 'production', replicas = 1, ...deploymentData } = deployModelDto;

    // Get model details
    const model = await this.prisma.aIModel.findUnique({
      where: { id: modelId, isActive: true },
    });

    if (!model) {
      throw new NotFoundException(`Model with ID ${modelId} not found or inactive`);
    }

    // Calculate deployment cost
    const costAIM = this.calculateDeploymentCost(deploymentType, replicas, deploymentData.resources);
    const monthlyFee = this.calculateMonthlyFee(deploymentType, replicas, deploymentData.resources);

    // TODO: Check if user has enough AIM tokens
    await this.checkUserBalance(userId, costAIM);

    try {
      // Create deployment record
      const deployment = await this.prisma.aIModelDeployment.create({
        data: {
          modelId,
          deployerId: userId,
          name,
          description,
          deploymentType,
          environment,
          replicas,
          resources: deploymentData.resources || this.getDefaultResources(deploymentType),
          scaling: deploymentData.scaling || this.getDefaultScaling(deploymentType),
          monitoring: deploymentData.monitoring || this.getDefaultMonitoring(),
          costAIM: BigInt(costAIM),
          monthlyFee: BigInt(monthlyFee),
          isPublic: deploymentData.isPublic ?? true,
          metadata: deploymentData.metadata,
          status: 'deploying',
        },
        include: {
          model: {
            select: {
              id: true,
              name: true,
              modelType: true,
              version: true,
            },
          },
          deployer: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
      });

      // TODO: Deploy to actual infrastructure
      const endpoint = await this.deployToInfrastructure(deployment, deploymentData.templateId, deploymentData.infrastructureId);

      // Update deployment with endpoint
      const updatedDeployment = await this.prisma.aIModelDeployment.update({
        where: { id: deployment.id },
        data: {
          endpoint,
          status: 'active',
          deployedAt: new Date(),
        },
      });

      // TODO: Deduct AIM tokens from user
      await this.deductAIMTokens(userId, costAIM);

      // Log deployment
      await this.logDeployment(deployment.id, 'info', `Model deployed successfully to ${endpoint}`);

      return updatedDeployment;
    } catch (error) {
      // Update deployment as failed
      await this.prisma.aIModelDeployment.update({
        where: { id: deployment.id },
        data: {
          status: 'failed',
        },
      });

      await this.logDeployment(deployment.id, 'error', `Deployment failed: ${error.message}`);

      throw new BadRequestException(`Model deployment failed: ${error.message}`);
    }
  }

  async makeModelRequest(userId: string, modelRequestDto: ModelRequestDto) {
    const { deploymentId, requestType, input, timeout = 30000, priority = 'normal' } = modelRequestDto;

    // Get deployment details
    const deployment = await this.prisma.aIModelDeployment.findUnique({
      where: { id: deploymentId, status: 'active', isActive: true },
      include: { model: true },
    });

    if (!deployment) {
      throw new NotFoundException(`Deployment with ID ${deploymentId} not found or inactive`);
    }

    try {
      const startTime = Date.now();

      // Create request record
      const request = await this.prisma.aIModelRequest.create({
        data: {
          deploymentId,
          userId,
          requestType,
          input,
          status: 'processing',
          userAgent: 'AIM-Deployment-Service',
          ipAddress: '127.0.0.1', // TODO: Get actual IP
        },
      });

      // TODO: Make actual request to deployed model
      const result = await this.callDeployedModel(deployment, input, timeout);

      const duration = Date.now() - startTime;
      const tokensUsed = this.estimateTokens(input) + this.estimateTokens(result);
      const costAIM = this.calculateRequestCost(deployment, tokensUsed);

      // Update request with results
      const updatedRequest = await this.prisma.aIModelRequest.update({
        where: { id: request.id },
        data: {
          output: result,
          tokensUsed,
          costAIM: BigInt(costAIM),
          duration,
          status: 'completed',
          completedAt: new Date(),
        },
      });

      // Update deployment usage and earnings
      await this.prisma.aIModelDeployment.update({
        where: { id: deploymentId },
        data: {
          usageCount: { increment: 1 },
          totalEarnings: { increment: BigInt(costAIM) },
        },
      });

      // TODO: Transfer AIM tokens from user to model owner and platform
      await this.transferAIMTokens(userId, deployment.deployerId, costAIM);

      // Log metrics
      await this.logMetrics(deploymentId, {
        latency: duration,
        throughput: 1,
        tokens_used: tokensUsed,
        cost_aim: costAIM,
      });

      return {
        requestId: updatedRequest.id,
        result,
        costAIM,
        duration,
        tokensUsed,
      };
    } catch (error) {
      // Update request as failed
      await this.prisma.aIModelRequest.update({
        where: { id: request.id },
        data: {
          status: 'failed',
          errorMessage: error.message,
          completedAt: new Date(),
        },
      });

      throw new BadRequestException(`Model request failed: ${error.message}`);
    }
  }

  async findAllDeployments(filters?: {
    modelId?: string;
    deployerId?: string;
    deploymentType?: string;
    environment?: string;
    status?: string;
    isPublic?: boolean;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.modelId) {
      where.modelId = filters.modelId;
    }

    if (filters?.deployerId) {
      where.deployerId = filters.deployerId;
    }

    if (filters?.deploymentType) {
      where.deploymentType = filters.deploymentType;
    }

    if (filters?.environment) {
      where.environment = filters.environment;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.isPublic !== undefined) {
      where.isPublic = filters.isPublic;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const [deployments, total] = await Promise.all([
      this.prisma.aIModelDeployment.findMany({
        where,
        include: {
          model: {
            select: {
              id: true,
              name: true,
              modelType: true,
              version: true,
            },
          },
          deployer: {
            select: {
              id: true,
              displayName: true,
            },
          },
          _count: {
            select: {
              requests: true,
            },
          },
        },
        orderBy: [
          { usageCount: 'desc' },
          { createdAt: 'desc' },
        ],
        take: filters?.limit || 20,
        skip: filters?.offset || 0,
      }),
      this.prisma.aIModelDeployment.count({ where }),
    ]);

    return {
      deployments,
      total,
      limit: filters?.limit || 20,
      offset: filters?.offset || 0,
    };
  }

  async findDeploymentById(id: string) {
    const deployment = await this.prisma.aIModelDeployment.findUnique({
      where: { id },
      include: {
        model: {
          select: {
            id: true,
            name: true,
            modelType: true,
            version: true,
          },
        },
        deployer: {
          select: {
            id: true,
            displayName: true,
          },
        },
        _count: {
          select: {
            requests: true,
          },
        },
      },
    });

    if (!deployment) {
      throw new NotFoundException(`Deployment with ID ${id} not found`);
    }

    return deployment;
  }

  async getUserDeployments(userId: string) {
    return this.prisma.aIModelDeployment.findMany({
      where: { deployerId: userId },
      include: {
        model: {
          select: {
            id: true,
            name: true,
            modelType: true,
            version: true,
          },
        },
        _count: {
          select: {
            requests: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserRequests(userId: string, limit = 20, offset = 0) {
    const [requests, total] = await Promise.all([
      this.prisma.aIModelRequest.findMany({
        where: { userId },
        include: {
          deployment: {
            select: {
              id: true,
              name: true,
              endpoint: true,
              deploymentType: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.aIModelRequest.count({ where: { userId } }),
    ]);

    return {
      requests,
      total,
      limit,
      offset,
    };
  }

  async getDeploymentMetrics(deploymentId: string, timeRange?: string) {
    const timeRangeMs = this.parseTimeRange(timeRange || '1h');
    const startTime = new Date(Date.now() - timeRangeMs);

    return this.prisma.aIModelDeploymentMetrics.findMany({
      where: {
        deploymentId,
        timestamp: {
          gte: startTime,
        },
      },
      orderBy: { timestamp: 'asc' },
    });
  }

  async getDeploymentLogs(deploymentId: string, level?: string, limit = 100) {
    const where: any = { deploymentId };

    if (level) {
      where.level = level;
    }

    return this.prisma.aIModelDeploymentLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  async createDeploymentTemplate(createTemplateDto: CreateDeploymentTemplateDto) {
    return this.prisma.aIModelDeploymentTemplate.create({
      data: {
        ...createTemplateDto,
        tags: createTemplateDto.tags || [],
        isPublic: createTemplateDto.isPublic ?? true,
      },
    });
  }

  async findAllDeploymentTemplates(filters?: {
    deploymentType?: string;
    environment?: string;
    isPublic?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.deploymentType) {
      where.deploymentType = filters.deploymentType;
    }

    if (filters?.environment) {
      where.environment = filters.environment;
    }

    if (filters?.isPublic !== undefined) {
      where.isPublic = filters.isPublic;
    }

    const [templates, total] = await Promise.all([
      this.prisma.aIModelDeploymentTemplate.findMany({
        where,
        orderBy: [
          { usageCount: 'desc' },
          { rating: 'desc' },
          { createdAt: 'desc' },
        ],
        take: filters?.limit || 20,
        skip: filters?.offset || 0,
      }),
      this.prisma.aIModelDeploymentTemplate.count({ where }),
    ]);

    return {
      templates,
      total,
      limit: filters?.limit || 20,
      offset: filters?.offset || 0,
    };
  }

  private async deployToInfrastructure(deployment: any, templateId?: string, infrastructureId?: string): Promise<string> {
    // TODO: Implement actual infrastructure deployment
    // For now, simulate deployment
    await new Promise(resolve => setTimeout(resolve, Math.random() * 5000 + 2000));

    const deploymentId = deployment.id.substring(0, 8);
    return `https://api.aim-currency.com/v1/models/${deploymentId}/inference`;
  }

  private async callDeployedModel(deployment: any, input: any, timeout: number): Promise<any> {
    // TODO: Implement actual model inference call
    // For now, simulate model inference
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));

    return {
      result: `Model ${deployment.model.name} processed: ${JSON.stringify(input)}`,
      modelId: deployment.modelId,
      deploymentId: deployment.id,
      timestamp: new Date().toISOString(),
    };
  }

  private calculateDeploymentCost(deploymentType: string, replicas: number, resources: any): number {
    let baseCost = 100; // Base deployment cost in AIM tokens

    // Deployment type multipliers
    const typeMultipliers = {
      'endpoint': 1.0,
      'service': 1.5,
      'batch': 0.8,
      'streaming': 2.0,
    };

    // Replica cost
    const replicaCost = replicas * 50;

    // Resource cost
    let resourceCost = 0;
    if (resources) {
      if (resources.cpu) resourceCost += parseInt(resources.cpu) * 10;
      if (resources.memory) resourceCost += Math.ceil(parseInt(resources.memory) / 1024) * 5; // Per GB
      if (resources.gpu) resourceCost += parseInt(resources.gpu) * 100;
    }

    return Math.ceil(
      (baseCost + replicaCost + resourceCost) * typeMultipliers[deploymentType]
    );
  }

  private calculateMonthlyFee(deploymentType: string, replicas: number, resources: any): number {
    let baseFee = 200; // Base monthly fee in AIM tokens

    const typeMultipliers = {
      'endpoint': 1.0,
      'service': 1.2,
      'batch': 0.5,
      'streaming': 1.5,
    };

    const replicaFee = replicas * 100;
    let resourceFee = 0;
    if (resources) {
      if (resources.cpu) resourceFee += parseInt(resources.cpu) * 20;
      if (resources.memory) resourceFee += Math.ceil(parseInt(resources.memory) / 1024) * 10;
      if (resources.gpu) resourceFee += parseInt(resources.gpu) * 500;
    }

    return Math.ceil(
      (baseFee + replicaFee + resourceFee) * typeMultipliers[deploymentType]
    );
  }

  private calculateRequestCost(deployment: any, tokensUsed: number): number {
    const baseCostPerToken = Number(deployment.model.costPerToken);
    return Math.ceil(tokensUsed * baseCostPerToken * 1.1); // 10% platform fee
  }

  private getDefaultResources(deploymentType: string): any {
    const defaults = {
      'endpoint': { cpu: '1', memory: '2Gi' },
      'service': { cpu: '2', memory: '4Gi' },
      'batch': { cpu: '4', memory: '8Gi' },
      'streaming': { cpu: '2', memory: '4Gi' },
    };
    return defaults[deploymentType] || defaults['endpoint'];
  }

  private getDefaultScaling(deploymentType: string): any {
    const defaults = {
      'endpoint': { minReplicas: 1, maxReplicas: 10 },
      'service': { minReplicas: 2, maxReplicas: 20 },
      'batch': { minReplicas: 1, maxReplicas: 5 },
      'streaming': { minReplicas: 2, maxReplicas: 15 },
    };
    return defaults[deploymentType] || defaults['endpoint'];
  }

  private getDefaultMonitoring(): any {
    return {
      alerts: true,
      metrics: ['latency', 'throughput', 'error_rate', 'cpu_usage', 'memory_usage'],
    };
  }

  private estimateTokens(data: any): number {
    const text = JSON.stringify(data);
    return Math.ceil(text.length / 4); // Rough estimate: 4 characters per token
  }

  private parseTimeRange(timeRange: string): number {
    const ranges = {
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
    };
    return ranges[timeRange] || ranges['1h'];
  }

  private async logDeployment(deploymentId: string, level: string, message: string): Promise<void> {
    await this.prisma.aIModelDeploymentLog.create({
      data: {
        deploymentId,
        level,
        message,
        timestamp: new Date(),
      },
    });
  }

  private async logMetrics(deploymentId: string, metrics: any): Promise<void> {
    const metricEntries = Object.entries(metrics).map(([metric, value]) => ({
      deploymentId,
      metric,
      value: Number(value),
      unit: this.getMetricUnit(metric),
      timestamp: new Date(),
    }));

    await this.prisma.aIModelDeploymentMetrics.createMany({
      data: metricEntries,
    });
  }

  private getMetricUnit(metric: string): string {
    const units = {
      'latency': 'ms',
      'throughput': 'req/s',
      'error_rate': '%',
      'cpu_usage': '%',
      'memory_usage': '%',
      'tokens_used': 'count',
      'cost_aim': 'tokens',
    };
    return units[metric] || 'count';
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
        memo: 'AI Model Deployment Payment',
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
        memo: 'AI Model Request Payment',
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
