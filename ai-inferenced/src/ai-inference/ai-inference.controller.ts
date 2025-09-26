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
import { AIInferenceService } from './ai-inference.service';
import { InferenceRequestDto } from './dto/inference-request.dto';

// Simple auth guard - in production, integrate with proper JWT auth
class SimpleAuthGuard {
  canActivate(context: any): boolean {
    const request = context.switchToHttp().getRequest();
    return !!request.headers.authorization;
  }
}

@ApiTags('AI Inference')
@Controller('inference')
@UseGuards(SimpleAuthGuard)
@ApiBearerAuth()
export class AIInferenceController {
  constructor(private readonly aiInferenceService: AIInferenceService) {}

  @Post('request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a new AI inference request' })
  @ApiResponse({ status: 200, description: 'Inference request created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data or insufficient tokens' })
  async createInferenceRequest(@Request() req, @Body() inferenceRequestDto: InferenceRequestDto) {
    const userId = req.user?.id || 'default-user';
    return this.aiInferenceService.createInferenceRequest(userId, inferenceRequestDto);
  }

  @Get('request/:id')
  @ApiOperation({ summary: 'Get inference request by ID' })
  @ApiResponse({ status: 200, description: 'Inference request retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Inference request not found' })
  @ApiParam({ name: 'id', description: 'Request ID' })
  async getInferenceRequest(@Param('id') id: string) {
    return this.aiInferenceService.getInferenceRequest(id);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Get user inference sessions' })
  @ApiResponse({ status: 200, description: 'Sessions retrieved successfully' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by session status' })
  @ApiQuery({ name: 'modelId', required: false, description: 'Filter by model ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results to return' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of results to skip' })
  async getUserSessions(
    @Request() req,
    @Query('status') status?: string,
    @Query('modelId') modelId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const userId = req.user?.id || 'default-user';
    const filters = {
      status,
      modelId,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    };

    return this.aiInferenceService.getUserSessions(userId, filters);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get inference session by ID' })
  @ApiResponse({ status: 200, description: 'Session retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  async getInferenceSession(@Param('id') id: string, @Request() req) {
    const userId = req.user?.id || 'default-user';
    return this.aiInferenceService.getInferenceSession(id, userId);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get inference performance metrics' })
  @ApiResponse({ status: 200, description: 'Metrics retrieved successfully' })
  @ApiQuery({ name: 'modelId', required: false, description: 'Filter by model ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO string)' })
  async getInferenceMetrics(
    @Query('modelId') modelId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    let dateRange;
    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate),
        end: new Date(endDate),
      };
    }

    return this.aiInferenceService.getInferenceMetrics(modelId, dateRange);
  }

  @Get('endpoints')
  @ApiOperation({ summary: 'Get available model endpoints' })
  @ApiResponse({ status: 200, description: 'Endpoints retrieved successfully' })
  @ApiQuery({ name: 'modelId', required: false, description: 'Filter by model ID' })
  async getModelEndpoints(@Query('modelId') modelId?: string) {
    return this.aiInferenceService.getModelEndpoints(modelId);
  }
}
