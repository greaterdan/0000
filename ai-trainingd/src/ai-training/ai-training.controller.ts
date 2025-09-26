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
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AITrainingService } from './ai-training.service';
import { CreateTrainingJobDto } from './dto/create-training-job.dto';
import { CreateDatasetDto } from './dto/create-dataset.dto';

// Simple auth guard - in production, integrate with proper JWT auth
class SimpleAuthGuard {
  canActivate(context: any): boolean {
    const request = context.switchToHttp().getRequest();
    return !!request.headers.authorization;
  }
}

@ApiTags('AI Training')
@Controller('training')
@UseGuards(SimpleAuthGuard)
@ApiBearerAuth()
export class AITrainingController {
  constructor(private readonly aiTrainingService: AITrainingService) {}

  @Post('jobs')
  @ApiOperation({ summary: 'Create a new AI training job' })
  @ApiResponse({ status: 201, description: 'Training job created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data or insufficient tokens' })
  async createTrainingJob(@Request() req, @Body() createTrainingJobDto: CreateTrainingJobDto) {
    const userId = req.user?.id || 'default-user';
    return this.aiTrainingService.createTrainingJob(userId, createTrainingJobDto);
  }

  @Get('jobs')
  @ApiOperation({ summary: 'Get AI training jobs' })
  @ApiResponse({ status: 200, description: 'Training jobs retrieved successfully' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by job status' })
  @ApiQuery({ name: 'modelType', required: false, description: 'Filter by model type' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results to return' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of results to skip' })
  async getTrainingJobs(
    @Request() req,
    @Query('status') status?: string,
    @Query('modelType') modelType?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const userId = req.user?.id || 'default-user';
    const filters = {
      status,
      modelType,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    };

    return this.aiTrainingService.getTrainingJobs(userId, filters);
  }

  @Get('jobs/all')
  @ApiOperation({ summary: 'Get all training jobs (admin only)' })
  @ApiResponse({ status: 200, description: 'All training jobs retrieved successfully' })
  async getAllTrainingJobs(
    @Query('status') status?: string,
    @Query('modelType') modelType?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const filters = {
      status,
      modelType,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    };

    return this.aiTrainingService.getTrainingJobs(undefined, filters);
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get a specific training job by ID' })
  @ApiResponse({ status: 200, description: 'Training job retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Training job not found' })
  @ApiParam({ name: 'id', description: 'Training job ID' })
  async getTrainingJobById(@Param('id') id: string) {
    return this.aiTrainingService.getTrainingJobById(id);
  }

  @Delete('jobs/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a training job' })
  @ApiResponse({ status: 200, description: 'Training job cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Training job not found' })
  @ApiResponse({ status: 400, description: 'Cannot cancel this job' })
  @ApiParam({ name: 'id', description: 'Training job ID' })
  async cancelTrainingJob(@Request() req, @Param('id') id: string) {
    const userId = req.user?.id || 'default-user';
    return this.aiTrainingService.cancelTrainingJob(userId, id);
  }

  @Post('datasets')
  @ApiOperation({ summary: 'Create a new training dataset' })
  @ApiResponse({ status: 201, description: 'Dataset created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createDataset(@Request() req, @Body() createDatasetDto: CreateDatasetDto) {
    const userId = req.user?.id || 'default-user';
    return this.aiTrainingService.createDataset(userId, createDatasetDto);
  }

  @Get('datasets')
  @ApiOperation({ summary: 'Get training datasets' })
  @ApiResponse({ status: 200, description: 'Datasets retrieved successfully' })
  @ApiQuery({ name: 'dataType', required: false, description: 'Filter by data type' })
  @ApiQuery({ name: 'isPublic', required: false, description: 'Filter by public status' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by creator ID' })
  @ApiQuery({ name: 'tags', required: false, description: 'Filter by tags (comma-separated)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results to return' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of results to skip' })
  async getDatasets(
    @Query('dataType') dataType?: string,
    @Query('isPublic') isPublic?: string,
    @Query('userId') userId?: string,
    @Query('tags') tags?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const filters = {
      dataType,
      isPublic: isPublic ? isPublic === 'true' : undefined,
      userId,
      tags: tags ? tags.split(',') : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    };

    return this.aiTrainingService.getDatasets(filters);
  }

  @Get('datasets/:id')
  @ApiOperation({ summary: 'Get a specific dataset by ID' })
  @ApiResponse({ status: 200, description: 'Dataset retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Dataset not found' })
  @ApiParam({ name: 'id', description: 'Dataset ID' })
  async getDatasetById(@Param('id') id: string) {
    return this.aiTrainingService.getDatasetById(id);
  }

  @Get('queue')
  @ApiOperation({ summary: 'Get training job queue' })
  @ApiResponse({ status: 200, description: 'Training queue retrieved successfully' })
  async getTrainingQueue() {
    return this.aiTrainingService.getTrainingQueue();
  }

  @Get('resources')
  @ApiOperation({ summary: 'Get available training resources' })
  @ApiResponse({ status: 200, description: 'Training resources retrieved successfully' })
  async getTrainingResources() {
    return this.aiTrainingService.getTrainingResources();
  }
}
