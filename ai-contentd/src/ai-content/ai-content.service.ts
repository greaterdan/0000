import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GenerateContentDto } from './dto/generate-content.dto';
import { PurchaseContentDto } from './dto/purchase-content.dto';
import { ReviewContentDto } from './dto/review-content.dto';
import axios from 'axios';

@Injectable()
export class AIContentService {
  constructor(private prisma: PrismaService) {}

  async generateContent(userId: string, generateContentDto: GenerateContentDto) {
    const { prompt, contentType, category, parameters = {}, model = 'gpt-4', ...contentData } = generateContentDto;

    // Calculate generation cost
    const costAIM = this.calculateGenerationCost(contentType, prompt, parameters);

    // TODO: Check if user has enough AIM tokens
    await this.checkUserBalance(userId, costAIM);

    try {
      const startTime = Date.now();

      // TODO: Call actual AI content generation API
      const generatedContent = await this.callContentGenerationAPI(prompt, contentType, parameters, model);

      const duration = Date.now() - startTime;
      const tokensUsed = this.estimateTokens(prompt) + this.estimateTokens(generatedContent);

      // Create content record
      const content = await this.prisma.aIContent.create({
        data: {
          ...contentData,
          creatorId: userId,
          contentType,
          category,
          prompt,
          generatedContent,
          metadata: {
            model,
            parameters,
            tokensUsed,
            duration,
          },
          costAIM: BigInt(costAIM),
          tags: contentData.tags || [],
          isPublic: contentData.isPublic ?? false,
          isForSale: contentData.isForSale ?? false,
          salePrice: contentData.salePrice ? BigInt(contentData.salePrice) : null,
          downloadUrl: this.generateDownloadUrl(contentType),
          previewUrl: this.generatePreviewUrl(contentType),
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

      // Create generation record
      await this.prisma.aIContentGeneration.create({
        data: {
          contentId: content.id,
          userId,
          prompt,
          parameters,
          model,
          tokensUsed,
          costAIM: BigInt(costAIM),
          duration,
          success: true,
        },
      });

      // TODO: Deduct AIM tokens from user
      await this.deductAIMTokens(userId, costAIM);

      return content;
    } catch (error) {
      // Record failed generation
      await this.prisma.aIContentGeneration.create({
        data: {
          userId,
          prompt,
          parameters,
          model,
          tokensUsed: 0,
          costAIM: BigInt(0),
          duration: 0,
          success: false,
          errorMessage: error.message,
        },
      });

      throw new BadRequestException(`Content generation failed: ${error.message}`);
    }
  }

  async findAllContent(filters?: {
    contentType?: string;
    category?: string;
    tags?: string[];
    isPublic?: boolean;
    isForSale?: boolean;
    creatorId?: string;
    minRating?: number;
    maxPrice?: number;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.contentType) {
      where.contentType = filters.contentType;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    if (filters?.isPublic !== undefined) {
      where.isPublic = filters.isPublic;
    }

    if (filters?.isForSale !== undefined) {
      where.isForSale = filters.isForSale;
    }

    if (filters?.creatorId) {
      where.creatorId = filters.creatorId;
    }

    if (filters?.minRating) {
      where.rating = {
        gte: filters.minRating,
      };
    }

    if (filters?.maxPrice) {
      where.salePrice = {
        lte: filters.maxPrice,
      };
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [content, total] = await Promise.all([
      this.prisma.aIContent.findMany({
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
              purchases: true,
              reviews: true,
              generations: true,
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
      this.prisma.aIContent.count({ where }),
    ]);

    return {
      content,
      total,
      limit: filters?.limit || 20,
      offset: filters?.offset || 0,
    };
  }

  async findContentById(id: string) {
    const content = await this.prisma.aIContent.findUnique({
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
            purchases: true,
            reviews: true,
            generations: true,
          },
        },
      },
    });

    if (!content) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }

    return content;
  }

  async purchaseContent(userId: string, purchaseContentDto: PurchaseContentDto) {
    const { contentId, maxDownloads = 5 } = purchaseContentDto;

    // Get content details
    const content = await this.prisma.aIContent.findUnique({
      where: { id: contentId, isForSale: true },
      include: { creator: true },
    });

    if (!content) {
      throw new NotFoundException(`Content with ID ${contentId} not found or not for sale`);
    }

    // Check if user already purchased this content
    const existingPurchase = await this.prisma.aIContentPurchase.findFirst({
      where: {
        buyerId: userId,
        contentId,
        isActive: true,
      },
    });

    if (existingPurchase) {
      throw new BadRequestException('You have already purchased this content');
    }

    try {
      // TODO: Check if user has enough AIM tokens
      await this.checkUserBalance(userId, Number(content.salePrice));

      // Create purchase record
      const purchase = await this.prisma.aIContentPurchase.create({
        data: {
          buyerId: userId,
          contentId,
          costAIM: content.salePrice,
          downloadUrl: this.generatePurchaseDownloadUrl(contentId, userId),
          downloadExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          maxDownloads,
          isActive: true,
        },
      });

      // Update content usage count and earnings
      await this.prisma.aIContent.update({
        where: { id: contentId },
        data: {
          usageCount: { increment: 1 },
          totalEarnings: { increment: content.salePrice },
        },
      });

      // TODO: Transfer AIM tokens from buyer to creator and platform
      await this.transferAIMTokens(userId, content.creatorId, Number(content.salePrice));

      return {
        purchaseId: purchase.id,
        downloadUrl: purchase.downloadUrl,
        downloadExpiry: purchase.downloadExpiry,
        maxDownloads,
        costAIM: Number(content.salePrice),
      };
    } catch (error) {
      throw new BadRequestException(`Failed to purchase content: ${error.message}`);
    }
  }

  async downloadContent(userId: string, purchaseId: string) {
    const purchase = await this.prisma.aIContentPurchase.findFirst({
      where: {
        id: purchaseId,
        buyerId: userId,
        isActive: true,
      },
      include: { content: true },
    });

    if (!purchase) {
      throw new NotFoundException('Purchase not found or inactive');
    }

    if (new Date() > purchase.downloadExpiry) {
      throw new BadRequestException('Download link has expired');
    }

    if (purchase.downloadCount >= purchase.maxDownloads) {
      throw new BadRequestException('Maximum download limit reached');
    }

    // Update download count
    await this.prisma.aIContentPurchase.update({
      where: { id: purchaseId },
      data: {
        downloadCount: { increment: 1 },
      },
    });

    return {
      downloadUrl: purchase.downloadUrl,
      content: purchase.content,
      downloadsRemaining: purchase.maxDownloads - purchase.downloadCount - 1,
      expiresAt: purchase.downloadExpiry,
    };
  }

  async reviewContent(userId: string, reviewContentDto: ReviewContentDto) {
    const { contentId, rating, comment, quality, creativity, usefulness, originality } = reviewContentDto;

    // Check if content exists
    const content = await this.prisma.aIContent.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException(`Content with ID ${contentId} not found`);
    }

    // Check if user has purchased or generated this content
    const purchase = await this.prisma.aIContentPurchase.findFirst({
      where: {
        buyerId: userId,
        contentId,
        isActive: true,
      },
    });

    const generation = await this.prisma.aIContentGeneration.findFirst({
      where: {
        userId,
        contentId,
        success: true,
      },
    });

    if (!purchase && !generation && content.creatorId !== userId) {
      throw new BadRequestException('You must purchase or generate this content before reviewing it');
    }

    // Create or update review
    const review = await this.prisma.aIContentReview.upsert({
      where: {
        userId_contentId: {
          userId,
          contentId,
        },
      },
      update: {
        rating,
        comment,
        quality,
        creativity,
        usefulness,
        originality,
      },
      create: {
        userId,
        contentId,
        rating,
        comment,
        quality,
        creativity,
        usefulness,
        originality,
      },
    });

    // Update content average rating
    const reviews = await this.prisma.aIContentReview.findMany({
      where: { contentId },
      select: { rating: true },
    });

    const avgRating = reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length;

    await this.prisma.aIContent.update({
      where: { id: contentId },
      data: { rating: avgRating },
    });

    return review;
  }

  async getUserContent(userId: string) {
    return this.prisma.aIContent.findMany({
      where: { creatorId: userId },
      include: {
        _count: {
          select: {
            purchases: true,
            reviews: true,
            generations: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserPurchases(userId: string, limit = 20, offset = 0) {
    const [purchases, total] = await Promise.all([
      this.prisma.aIContentPurchase.findMany({
        where: { buyerId: userId, isActive: true },
        include: {
          content: {
            select: {
              id: true,
              title: true,
              contentType: true,
              category: true,
              previewUrl: true,
            },
          },
        },
        orderBy: { purchasedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.aIContentPurchase.count({ where: { buyerId: userId, isActive: true } }),
    ]);

    return {
      purchases,
      total,
      limit,
      offset,
    };
  }

  async getUserGenerations(userId: string, limit = 20, offset = 0) {
    const [generations, total] = await Promise.all([
      this.prisma.aIContentGeneration.findMany({
        where: { userId, success: true },
        include: {
          content: {
            select: {
              id: true,
              title: true,
              contentType: true,
              category: true,
              previewUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.aIContentGeneration.count({ where: { userId, success: true } }),
    ]);

    return {
      generations,
      total,
      limit,
      offset,
    };
  }

  async getContentTemplates() {
    return this.prisma.aIContentTemplate.findMany({
      where: { isPublic: true },
      orderBy: { usageCount: 'desc' },
    });
  }

  async getContentCategories() {
    return this.prisma.aIContentCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  private calculateGenerationCost(contentType: string, prompt: string, parameters: any): number {
    let baseCost = 10; // Base generation cost in AIM tokens

    // Content type multipliers
    const typeMultipliers = {
      'text': 1.0,
      'image': 5.0,
      'audio': 3.0,
      'video': 10.0,
      'code': 2.0,
    };

    // Prompt length factor
    const promptTokens = this.estimateTokens(prompt);
    const promptCost = Math.ceil(promptTokens * 0.001);

    // Parameters complexity factor
    const parametersCost = Object.keys(parameters).length * 2;

    return Math.ceil(
      (baseCost + promptCost + parametersCost) * typeMultipliers[contentType]
    );
  }

  private async callContentGenerationAPI(prompt: string, contentType: string, parameters: any, model: string): Promise<any> {
    // TODO: Implement actual AI content generation
    // For now, simulate content generation
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));

    switch (contentType) {
      case 'text':
        return {
          text: `Generated text content for: ${prompt}`,
          wordCount: Math.floor(Math.random() * 1000) + 100,
          tone: parameters.tone || 'neutral',
        };

      case 'image':
        return {
          imageUrl: `https://generated-images.example.com/${Date.now()}.png`,
          prompt: prompt,
          style: parameters.style || 'realistic',
          dimensions: parameters.dimensions || '1024x1024',
        };

      case 'audio':
        return {
          audioUrl: `https://generated-audio.example.com/${Date.now()}.mp3`,
          prompt: prompt,
          duration: Math.random() * 60 + 10, // 10-70 seconds
          format: 'mp3',
        };

      case 'video':
        return {
          videoUrl: `https://generated-video.example.com/${Date.now()}.mp4`,
          prompt: prompt,
          duration: Math.random() * 120 + 30, // 30-150 seconds
          resolution: '1080p',
        };

      case 'code':
        return {
          code: `// Generated code for: ${prompt}\nfunction generatedFunction() {\n  return "Hello World";\n}`,
          language: parameters.language || 'javascript',
          framework: parameters.framework || 'none',
        };

      default:
        return {
          content: `Generated ${contentType} content for: ${prompt}`,
          type: contentType,
        };
    }
  }

  private generateDownloadUrl(contentType: string): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    return `${process.env.CONTENT_BASE_URL || 'https://content.aim-currency.com'}/download/${contentType}/${timestamp}-${randomId}`;
  }

  private generatePreviewUrl(contentType: string): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    return `${process.env.CONTENT_BASE_URL || 'https://content.aim-currency.com'}/preview/${contentType}/${timestamp}-${randomId}`;
  }

  private generatePurchaseDownloadUrl(contentId: string, userId: string): string {
    const token = Buffer.from(`${contentId}:${userId}:${Date.now()}`).toString('base64');
    return `${process.env.CONTENT_BASE_URL || 'https://content.aim-currency.com'}/purchase/${token}`;
  }

  private estimateTokens(text: string): number {
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
        memo: 'AI Content Generation Payment',
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
        memo: 'AI Content Purchase Payment',
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
