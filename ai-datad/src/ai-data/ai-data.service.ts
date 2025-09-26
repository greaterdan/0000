import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDataProductDto } from './dto/create-data-product.dto';
import { PurchaseDataDto } from './dto/purchase-data.dto';
import { ReviewDataDto } from './dto/review-data.dto';
import axios from 'axios';

@Injectable()
export class AIDataService {
  constructor(private prisma: PrismaService) {}

  async createDataProduct(userId: string, createDataProductDto: CreateDataProductDto) {
    return this.prisma.aIDataProduct.create({
      data: {
        ...createDataProductDto,
        creatorId: userId,
        tags: createDataProductDto.tags || [],
        license: createDataProductDto.license || 'research',
        isPublic: createDataProductDto.isPublic ?? false,
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

  async findAllDataProducts(filters?: {
    dataType?: string;
    category?: string;
    tags?: string[];
    isPublic?: boolean;
    creatorId?: string;
    license?: string;
    minRating?: number;
    maxCost?: number;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.dataType) {
      where.dataType = filters.dataType;
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

    if (filters?.creatorId) {
      where.creatorId = filters.creatorId;
    }

    if (filters?.license) {
      where.license = filters.license;
    }

    if (filters?.minRating) {
      where.rating = {
        gte: filters.minRating,
      };
    }

    if (filters?.maxCost) {
      where.costAIM = {
        lte: filters.maxCost,
      };
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [dataProducts, total] = await Promise.all([
      this.prisma.aIDataProduct.findMany({
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
      this.prisma.aIDataProduct.count({ where }),
    ]);

    return {
      dataProducts,
      total,
      limit: filters?.limit || 20,
      offset: filters?.offset || 0,
    };
  }

  async findDataProductById(id: string) {
    const dataProduct = await this.prisma.aIDataProduct.findUnique({
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
          },
        },
      },
    });

    if (!dataProduct) {
      throw new NotFoundException(`Data product with ID ${id} not found`);
    }

    return dataProduct;
  }

  async purchaseDataProduct(userId: string, purchaseDataDto: PurchaseDataDto) {
    const { dataProductId, maxDownloads = 5 } = purchaseDataDto;

    // Get data product details
    const dataProduct = await this.prisma.aIDataProduct.findUnique({
      where: { id: dataProductId, isActive: true },
      include: { creator: true },
    });

    if (!dataProduct) {
      throw new NotFoundException(`Data product with ID ${dataProductId} not found or inactive`);
    }

    // Check if user already purchased this data product
    const existingPurchase = await this.prisma.aIDataPurchase.findFirst({
      where: {
        buyerId: userId,
        dataProductId,
        isActive: true,
      },
    });

    if (existingPurchase) {
      throw new BadRequestException('You have already purchased this data product');
    }

    try {
      // TODO: Check if user has enough AIM tokens
      await this.checkUserBalance(userId, Number(dataProduct.costAIM));

      // Create purchase record
      const purchase = await this.prisma.aIDataPurchase.create({
        data: {
          buyerId: userId,
          dataProductId,
          costAIM: dataProduct.costAIM,
          downloadUrl: this.generateDownloadUrl(dataProductId, userId),
          downloadExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          maxDownloads,
          isActive: true,
        },
      });

      // Update data product usage count and earnings
      await this.prisma.aIDataProduct.update({
        where: { id: dataProductId },
        data: {
          usageCount: { increment: 1 },
          totalEarnings: { increment: dataProduct.costAIM },
        },
      });

      // TODO: Transfer AIM tokens from buyer to creator and platform
      await this.transferAIMTokens(userId, dataProduct.creatorId, Number(dataProduct.costAIM));

      return {
        purchaseId: purchase.id,
        downloadUrl: purchase.downloadUrl,
        downloadExpiry: purchase.downloadExpiry,
        maxDownloads,
        costAIM: Number(dataProduct.costAIM),
      };
    } catch (error) {
      throw new BadRequestException(`Failed to purchase data product: ${error.message}`);
    }
  }

  async getUserPurchases(userId: string, limit = 20, offset = 0) {
    const [purchases, total] = await Promise.all([
      this.prisma.aIDataPurchase.findMany({
        where: { buyerId: userId, isActive: true },
        include: {
          dataProduct: {
            select: {
              id: true,
              name: true,
              dataType: true,
              category: true,
              previewUrl: true,
            },
          },
        },
        orderBy: { purchasedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.aIDataPurchase.count({ where: { buyerId: userId, isActive: true } }),
    ]);

    return {
      purchases,
      total,
      limit,
      offset,
    };
  }

  async downloadDataProduct(userId: string, purchaseId: string) {
    const purchase = await this.prisma.aIDataPurchase.findFirst({
      where: {
        id: purchaseId,
        buyerId: userId,
        isActive: true,
      },
      include: { dataProduct: true },
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
    await this.prisma.aIDataPurchase.update({
      where: { id: purchaseId },
      data: {
        downloadCount: { increment: 1 },
      },
    });

    return {
      downloadUrl: purchase.downloadUrl,
      dataProduct: purchase.dataProduct,
      downloadsRemaining: purchase.maxDownloads - purchase.downloadCount - 1,
      expiresAt: purchase.downloadExpiry,
    };
  }

  async reviewDataProduct(userId: string, reviewDataDto: ReviewDataDto) {
    const { dataProductId, rating, comment, quality, completeness, accuracy } = reviewDataDto;

    // Check if data product exists
    const dataProduct = await this.prisma.aIDataProduct.findUnique({
      where: { id: dataProductId },
    });

    if (!dataProduct) {
      throw new NotFoundException(`Data product with ID ${dataProductId} not found`);
    }

    // Check if user has purchased this data product
    const purchase = await this.prisma.aIDataPurchase.findFirst({
      where: {
        buyerId: userId,
        dataProductId,
        isActive: true,
      },
    });

    if (!purchase) {
      throw new BadRequestException('You must purchase this data product before reviewing it');
    }

    // Create or update review
    const review = await this.prisma.aIDataReview.upsert({
      where: {
        userId_dataProductId: {
          userId,
          dataProductId,
        },
      },
      update: {
        rating,
        comment,
        quality,
        completeness,
        accuracy,
      },
      create: {
        userId,
        dataProductId,
        rating,
        comment,
        quality,
        completeness,
        accuracy,
      },
    });

    // Update data product average rating
    const reviews = await this.prisma.aIDataReview.findMany({
      where: { dataProductId },
      select: { rating: true },
    });

    const avgRating = reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length;

    await this.prisma.aIDataProduct.update({
      where: { id: dataProductId },
      data: { rating: avgRating },
    });

    return review;
  }

  async getUserDataProducts(userId: string) {
    return this.prisma.aIDataProduct.findMany({
      where: { creatorId: userId },
      include: {
        _count: {
          select: {
            purchases: true,
            reviews: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDataCategories() {
    return this.prisma.aIDataCategory.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            dataProducts: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getDataQualityMetrics(dataProductId: string) {
    return this.prisma.aIDataQuality.findMany({
      where: { dataProductId },
      orderBy: { calculatedAt: 'desc' },
    });
  }

  private async checkUserBalance(userId: string, costAIM: number): Promise<void> {
    // TODO: Integrate with the main AIM currency system to check balance
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

  private generateDownloadUrl(dataProductId: string, userId: string): string {
    // Generate a unique download URL with access token
    const token = Buffer.from(`${dataProductId}:${userId}:${Date.now()}`).toString('base64');
    return `${process.env.DOWNLOAD_BASE_URL || 'https://data.aim-currency.com'}/download/${token}`;
  }

  private async transferAIMTokens(fromUserId: string, toUserId: string, amount: number): Promise<void> {
    // TODO: Integrate with the main AIM currency system
    try {
      const gatewayUrl = process.env.GATEWAY_URL || 'http://localhost:3000';
      await axios.post(`${gatewayUrl}/api/v1/transfer`, {
        to: toUserId,
        microAmount: amount * 1000000, // Convert to microAIM
        memo: 'AI Data Purchase Payment',
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
