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
import { AIContentService } from './ai-content.service';
import { GenerateContentDto } from './dto/generate-content.dto';
import { PurchaseContentDto } from './dto/purchase-content.dto';
import { ReviewContentDto } from './dto/review-content.dto';

// Simple auth guard - in production, integrate with proper JWT auth
class SimpleAuthGuard {
  canActivate(context: any): boolean {
    const request = context.switchToHttp().getRequest();
    return !!request.headers.authorization;
  }
}

@ApiTags('AI Content Generation')
@Controller('content')
@UseGuards(SimpleAuthGuard)
@ApiBearerAuth()
export class AIContentController {
  constructor(private readonly aiContentService: AIContentService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate AI content' })
  @ApiResponse({ status: 201, description: 'Content generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data or insufficient tokens' })
  async generateContent(@Request() req, @Body() generateContentDto: GenerateContentDto) {
    const userId = req.user?.id || 'default-user';
    return this.aiContentService.generateContent(userId, generateContentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all generated content' })
  @ApiResponse({ status: 200, description: 'Content retrieved successfully' })
  @ApiQuery({ name: 'contentType', required: false, description: 'Filter by content type' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'tags', required: false, description: 'Filter by tags (comma-separated)' })
  @ApiQuery({ name: 'isPublic', required: false, description: 'Filter by public status' })
  @ApiQuery({ name: 'isForSale', required: false, description: 'Filter by sale status' })
  @ApiQuery({ name: 'creatorId', required: false, description: 'Filter by creator ID' })
  @ApiQuery({ name: 'minRating', required: false, description: 'Minimum rating' })
  @ApiQuery({ name: 'maxPrice', required: false, description: 'Maximum price in AIM tokens' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in title and description' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results to return' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of results to skip' })
  async findAllContent(
    @Query('contentType') contentType?: string,
    @Query('category') category?: string,
    @Query('tags') tags?: string,
    @Query('isPublic') isPublic?: string,
    @Query('isForSale') isForSale?: string,
    @Query('creatorId') creatorId?: string,
    @Query('minRating') minRating?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const filters = {
      contentType,
      category,
      tags: tags ? tags.split(',') : undefined,
      isPublic: isPublic ? isPublic === 'true' : undefined,
      isForSale: isForSale ? isForSale === 'true' : undefined,
      creatorId,
      minRating: minRating ? parseFloat(minRating) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice, 10) : undefined,
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    };

    return this.aiContentService.findAllContent(filters);
  }

  @Get('my-content')
  @ApiOperation({ summary: 'Get content created by the current user' })
  @ApiResponse({ status: 200, description: 'User content retrieved successfully' })
  async getUserContent(@Request() req) {
    const userId = req.user?.id || 'default-user';
    return this.aiContentService.getUserContent(userId);
  }

  @Get('my-purchases')
  @ApiOperation({ summary: 'Get content purchased by the current user' })
  @ApiResponse({ status: 200, description: 'User purchases retrieved successfully' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results to return' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of results to skip' })
  async getUserPurchases(
    @Request() req,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const userId = req.user?.id || 'default-user';
    return this.aiContentService.getUserPurchases(
      userId,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get('my-generations')
  @ApiOperation({ summary: 'Get content generation history for the current user' })
  @ApiResponse({ status: 200, description: 'User generations retrieved successfully' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results to return' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of results to skip' })
  async getUserGenerations(
    @Request() req,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const userId = req.user?.id || 'default-user';
    return this.aiContentService.getUserGenerations(
      userId,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific content by ID' })
  @ApiResponse({ status: 200, description: 'Content retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiParam({ name: 'id', description: 'Content ID' })
  async findContentById(@Param('id') id: string) {
    return this.aiContentService.findContentById(id);
  }

  @Post('purchase')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Purchase AI-generated content' })
  @ApiResponse({ status: 200, description: 'Content purchased successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or insufficient tokens' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  async purchaseContent(@Request() req, @Body() purchaseContentDto: PurchaseContentDto) {
    const userId = req.user?.id || 'default-user';
    return this.aiContentService.purchaseContent(userId, purchaseContentDto);
  }

  @Get('purchases/:purchaseId/download')
  @ApiOperation({ summary: 'Download purchased content' })
  @ApiResponse({ status: 200, description: 'Download information retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Purchase not found' })
  @ApiResponse({ status: 400, description: 'Download limit reached or expired' })
  @ApiParam({ name: 'purchaseId', description: 'Purchase ID' })
  async downloadContent(@Request() req, @Param('purchaseId') purchaseId: string) {
    const userId = req.user?.id || 'default-user';
    return this.aiContentService.downloadContent(userId, purchaseId);
  }

  @Post('review')
  @ApiOperation({ summary: 'Review AI-generated content' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data or not purchased' })
  async reviewContent(@Request() req, @Body() reviewContentDto: ReviewContentDto) {
    const userId = req.user?.id || 'default-user';
    return this.aiContentService.reviewContent(userId, reviewContentDto);
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get content generation templates' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async getContentTemplates() {
    return this.aiContentService.getContentTemplates();
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get content categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async getContentCategories() {
    return this.aiContentService.getContentCategories();
  }
}
