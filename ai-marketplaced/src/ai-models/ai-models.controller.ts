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
import { AIModelsService } from './ai-models.service';
import { CreateModelDto } from './dto/create-model.dto';
import { UseModelDto } from './dto/use-model.dto';
import { ReviewModelDto } from './dto/review-model.dto';

// Simple auth guard - in production, integrate with proper JWT auth
class SimpleAuthGuard {
  canActivate(context: any): boolean {
    const request = context.switchToHttp().getRequest();
    // For now, we'll use a simple header check
    // In production, this would validate JWT tokens
    return !!request.headers.authorization;
  }
}

@ApiTags('AI Models')
@Controller('models')
@UseGuards(SimpleAuthGuard)
@ApiBearerAuth()
export class AIModelsController {
  constructor(private readonly aiModelsService: AIModelsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new AI model' })
  @ApiResponse({ status: 201, description: 'Model created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createModel(@Request() req, @Body() createModelDto: CreateModelDto) {
    const userId = req.user?.id || 'default-user'; // In production, extract from JWT
    return this.aiModelsService.createModel(userId, createModelDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all available AI models' })
  @ApiResponse({ status: 200, description: 'List of models retrieved successfully' })
  @ApiQuery({ name: 'modelType', required: false, description: 'Filter by model type' })
  @ApiQuery({ name: 'tags', required: false, description: 'Filter by tags (comma-separated)' })
  @ApiQuery({ name: 'isPublic', required: false, description: 'Filter by public status' })
  @ApiQuery({ name: 'creatorId', required: false, description: 'Filter by creator ID' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in name and description' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results to return' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of results to skip' })
  async findAllModels(
    @Query('modelType') modelType?: string,
    @Query('tags') tags?: string,
    @Query('isPublic') isPublic?: string,
    @Query('creatorId') creatorId?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const filters = {
      modelType,
      tags: tags ? tags.split(',') : undefined,
      isPublic: isPublic ? isPublic === 'true' : undefined,
      creatorId,
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    };

    return this.aiModelsService.findAllModels(filters);
  }

  @Get('my-models')
  @ApiOperation({ summary: 'Get models created by the current user' })
  @ApiResponse({ status: 200, description: 'User models retrieved successfully' })
  async getUserModels(@Request() req) {
    const userId = req.user?.id || 'default-user';
    return this.aiModelsService.getUserModels(userId);
  }

  @Get('my-usage')
  @ApiOperation({ summary: 'Get usage history for the current user' })
  @ApiResponse({ status: 200, description: 'Usage history retrieved successfully' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results to return' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of results to skip' })
  async getUserUsage(
    @Request() req,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const userId = req.user?.id || 'default-user';
    return this.aiModelsService.getUserUsage(
      userId,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific AI model by ID' })
  @ApiResponse({ status: 200, description: 'Model retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Model not found' })
  @ApiParam({ name: 'id', description: 'Model ID' })
  async findModelById(@Param('id') id: string) {
    return this.aiModelsService.findModelById(id);
  }

  @Post('use')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Use an AI model for inference' })
  @ApiResponse({ status: 200, description: 'Model inference completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or model not found' })
  @ApiResponse({ status: 402, description: 'Insufficient AIM tokens' })
  async useModel(@Request() req, @Body() useModelDto: UseModelDto) {
    const userId = req.user?.id || 'default-user';
    return this.aiModelsService.useModel(userId, useModelDto);
  }

  @Post('review')
  @ApiOperation({ summary: 'Review an AI model' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async reviewModel(@Request() req, @Body() reviewModelDto: ReviewModelDto) {
    const userId = req.user?.id || 'default-user';
    return this.aiModelsService.reviewModel(userId, reviewModelDto);
  }
}
