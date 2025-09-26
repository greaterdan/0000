import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AIDataService } from './ai-data.service';
import { CreateDataProductDto } from './dto/create-data-product.dto';
import { PurchaseDataDto } from './dto/purchase-data.dto';
import { ReviewDataDto } from './dto/review-data.dto';

// Simple auth guard - in production, integrate with proper JWT auth
class SimpleAuthGuard {
  canActivate(context: any): boolean {
    const request = context.switchToHttp().getRequest();
    return !!request.headers.authorization;
  }
}

@ApiTags('AI Data Marketplace')
@Controller('data')
@UseGuards(SimpleAuthGuard)
@ApiBearerAuth()
export class AIDataController {
  constructor(private readonly aiDataService: AIDataService) {}

  @Post('products')
  @ApiOperation({ summary: 'Create a new data product' })
  @ApiResponse({ status: 201, description: 'Data product created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createDataProduct(@Request() req, @Body() createDataProductDto: CreateDataProductDto) {
    const userId = req.user?.id || 'default-user';
    return this.aiDataService.createDataProduct(userId, createDataProductDto);
  }

  @Get('products')
  @ApiOperation({ summary: 'Get all available data products' })
  @ApiResponse({ status: 200, description: 'Data products retrieved successfully' })
  @ApiQuery({ name: 'dataType', required: false, description: 'Filter by data type' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'tags', required: false, description: 'Filter by tags (comma-separated)' })
  @ApiQuery({ name: 'isPublic', required: false, description: 'Filter by public status' })
  @ApiQuery({ name: 'creatorId', required: false, description: 'Filter by creator ID' })
  @ApiQuery({ name: 'license', required: false, description: 'Filter by license' })
  @ApiQuery({ name: 'minRating', required: false, description: 'Minimum rating' })
  @ApiQuery({ name: 'maxCost', required: false, description: 'Maximum cost in AIM tokens' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in name and description' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results to return' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of results to skip' })
  async findAllDataProducts(
    @Query('dataType') dataType?: string,
    @Query('category') category?: string,
    @Query('tags') tags?: string,
    @Query('isPublic') isPublic?: string,
    @Query('creatorId') creatorId?: string,
    @Query('license') license?: string,
    @Query('minRating') minRating?: string,
    @Query('maxCost') maxCost?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const filters = {
      dataType,
      category,
      tags: tags ? tags.split(',') : undefined,
      isPublic: isPublic ? isPublic === 'true' : undefined,
      creatorId,
      license,
      minRating: minRating ? parseFloat(minRating) : undefined,
      maxCost: maxCost ? parseInt(maxCost, 10) : undefined,
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    };

    return this.aiDataService.findAllDataProducts(filters);
  }

  @Get('products/my-products')
  @ApiOperation({ summary: 'Get data products created by the current user' })
  @ApiResponse({ status: 200, description: 'User data products retrieved successfully' })
  async getUserDataProducts(@Request() req) {
    const userId = req.user?.id || 'default-user';
    return this.aiDataService.getUserDataProducts(userId);
  }

  @Get('products/my-purchases')
  @ApiOperation({ summary: 'Get data products purchased by the current user' })
  @ApiResponse({ status: 200, description: 'User purchases retrieved successfully' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results to return' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of results to skip' })
  async getUserPurchases(
    @Request() req,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const userId = req.user?.id || 'default-user';
    return this.aiDataService.getUserPurchases(
      userId,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get a specific data product by ID' })
  @ApiResponse({ status: 200, description: 'Data product retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Data product not found' })
  @ApiParam({ name: 'id', description: 'Data product ID' })
  async findDataProductById(@Param('id') id: string) {
    return this.aiDataService.findDataProductById(id);
  }

  @Post('purchase')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Purchase a data product' })
  @ApiResponse({ status: 200, description: 'Data product purchased successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or insufficient tokens' })
  @ApiResponse({ status: 404, description: 'Data product not found' })
  async purchaseDataProduct(@Request() req, @Body() purchaseDataDto: PurchaseDataDto) {
    const userId = req.user?.id || 'default-user';
    return this.aiDataService.purchaseDataProduct(userId, purchaseDataDto);
  }

  @Get('purchases/:purchaseId/download')
  @ApiOperation({ summary: 'Download a purchased data product' })
  @ApiResponse({ status: 200, description: 'Download information retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Purchase not found' })
  @ApiResponse({ status: 400, description: 'Download limit reached or expired' })
  @ApiParam({ name: 'purchaseId', description: 'Purchase ID' })
  async downloadDataProduct(@Request() req, @Param('purchaseId') purchaseId: string) {
    const userId = req.user?.id || 'default-user';
    return this.aiDataService.downloadDataProduct(userId, purchaseId);
  }

  @Post('review')
  @ApiOperation({ summary: 'Review a data product' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data or not purchased' })
  async reviewDataProduct(@Request() req, @Body() reviewDataDto: ReviewDataDto) {
    const userId = req.user?.id || 'default-user';
    return this.aiDataService.reviewDataProduct(userId, reviewDataDto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all data categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async getDataCategories() {
    return this.aiDataService.getDataCategories();
  }

  @Get('products/:id/quality')
  @ApiOperation({ summary: 'Get quality metrics for a data product' })
  @ApiResponse({ status: 200, description: 'Quality metrics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Data product not found' })
  @ApiParam({ name: 'id', description: 'Data product ID' })
  async getDataQualityMetrics(@Param('id') id: string) {
    return this.aiDataService.getDataQualityMetrics(id);
  }
}
