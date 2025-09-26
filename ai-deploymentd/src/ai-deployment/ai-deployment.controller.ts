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
import { AIDeploymentService } from './ai-deployment.service';
import { DeployModelDto } from './dto/deploy-model.dto';
import { ModelRequestDto } from './dto/model-request.dto';
import { CreateDeploymentTemplateDto } from './dto/create-template.dto';

// Simple auth guard - in production, integrate with proper JWT auth
class SimpleAuthGuard {
  canActivate(context: any): boolean {
    const request = context.switchToHttp().getRequest();
    return !!request.headers.authorization;
  }
}

@ApiTags('AI Model Deployment')
@Controller('deployment')
@UseGuards(SimpleAuthGuard)
@ApiBearerAuth()
export class AIDeploymentController {
  constructor(private readonly aiDeploymentService: AIDeploymentService) {}

  @Post('deploy')
  @ApiOperation({ summary: 'Deploy an AI model' })
  @ApiResponse({ status: 201, description: 'Model deployment started successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data or insufficient tokens' })
  @ApiResponse({ status: 404, description: 'Model not found' })
  async deployModel(@Request() req, @Body() deployModelDto: DeployModelDto) {
    const userId = req.user?.id || 'default-user';
    return this.aiDeploymentService.deployModel(userId, deployModelDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all model deployments' })
  @ApiResponse({ status: 200, description: 'Deployments retrieved successfully' })
  @ApiQuery({ name: 'modelId', required: false, description: 'Filter by model ID' })
  @ApiQuery({ name: 'deployerId', required: false, description: 'Filter by deployer ID' })
  @ApiQuery({ name: 'deploymentType', required: false, description: 'Filter by deployment type' })
  @ApiQuery({ name: 'environment', required: false, description: 'Filter by environment' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'isPublic', required: false, description: 'Filter by public status' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results to return' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of results to skip' })
  async findAllDeployments(
    @Query('modelId') modelId?: string,
    @Query('deployerId') deployerId?: string,
    @Query('deploymentType') deploymentType?: string,
    @Query('environment') environment?: string,
    @Query('status') status?: string,
    @Query('isPublic') isPublic?: string,
    @Query('isActive') isActive?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const filters = {
      modelId,
      deployerId,
      deploymentType,
      environment,
      status,
      isPublic: isPublic ? isPublic === 'true' : undefined,
      isActive: isActive ? isActive === 'true' : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    };

    return this.aiDeploymentService.findAllDeployments(filters);
  }

  @Get('my-deployments')
  @ApiOperation({ summary: 'Get deployments by the current user' })
  @ApiResponse({ status: 200, description: 'User deployments retrieved successfully' })
  async getUserDeployments(@Request() req) {
    const userId = req.user?.id || 'default-user';
    return this.aiDeploymentService.getUserDeployments(userId);
  }

  @Get('my-requests')
  @ApiOperation({ summary: 'Get requests made by the current user' })
  @ApiResponse({ status: 200, description: 'User requests retrieved successfully' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results to return' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of results to skip' })
  async getUserRequests(
    @Request() req,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const userId = req.user?.id || 'default-user';
    return this.aiDeploymentService.getUserRequests(
      userId,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific deployment by ID' })
  @ApiResponse({ status: 200, description: 'Deployment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Deployment not found' })
  @ApiParam({ name: 'id', description: 'Deployment ID' })
  async findDeploymentById(@Param('id') id: string) {
    return this.aiDeploymentService.findDeploymentById(id);
  }

  @Get(':id/metrics')
  @ApiOperation({ summary: 'Get deployment metrics' })
  @ApiResponse({ status: 200, description: 'Metrics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Deployment not found' })
  @ApiParam({ name: 'id', description: 'Deployment ID' })
  @ApiQuery({ name: 'timeRange', required: false, description: 'Time range (5m, 15m, 1h, 4h, 24h, 7d)' })
  async getDeploymentMetrics(
    @Param('id') id: string,
    @Query('timeRange') timeRange?: string,
  ) {
    return this.aiDeploymentService.getDeploymentMetrics(id, timeRange);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get deployment logs' })
  @ApiResponse({ status: 200, description: 'Logs retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Deployment not found' })
  @ApiParam({ name: 'id', description: 'Deployment ID' })
  @ApiQuery({ name: 'level', required: false, description: 'Log level (info, warning, error, debug)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of log entries to return' })
  async getDeploymentLogs(
    @Param('id') id: string,
    @Query('level') level?: string,
    @Query('limit') limit?: string,
  ) {
    return this.aiDeploymentService.getDeploymentLogs(
      id,
      level,
      limit ? parseInt(limit, 10) : 100,
    );
  }

  @Post('request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Make a request to a deployed model' })
  @ApiResponse({ status: 200, description: 'Request completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or deployment not found' })
  @ApiResponse({ status: 402, description: 'Insufficient AIM tokens' })
  async makeModelRequest(@Request() req, @Body() modelRequestDto: ModelRequestDto) {
    const userId = req.user?.id || 'default-user';
    return this.aiDeploymentService.makeModelRequest(userId, modelRequestDto);
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create a deployment template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createDeploymentTemplate(@Body() createTemplateDto: CreateDeploymentTemplateDto) {
    return this.aiDeploymentService.createDeploymentTemplate(createTemplateDto);
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get all deployment templates' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  @ApiQuery({ name: 'deploymentType', required: false, description: 'Filter by deployment type' })
  @ApiQuery({ name: 'environment', required: false, description: 'Filter by environment' })
  @ApiQuery({ name: 'isPublic', required: false, description: 'Filter by public status' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results to return' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of results to skip' })
  async findAllDeploymentTemplates(
    @Query('deploymentType') deploymentType?: string,
    @Query('environment') environment?: string,
    @Query('isPublic') isPublic?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const filters = {
      deploymentType,
      environment,
      isPublic: isPublic ? isPublic === 'true' : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    };

    return this.aiDeploymentService.findAllDeploymentTemplates(filters);
  }
}
