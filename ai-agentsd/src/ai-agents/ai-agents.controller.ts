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
import { AIAgentsService } from './ai-agents.service';
import { RegisterAgentDto } from './dto/register-agent.dto';
import { InteractAgentDto } from './dto/interact-agent.dto';
import { ReviewAgentDto } from './dto/review-agent.dto';
import { SubscribeAgentDto } from './dto/subscribe-agent.dto';

// Simple auth guard - in production, integrate with proper JWT auth
class SimpleAuthGuard {
  canActivate(context: any): boolean {
    const request = context.switchToHttp().getRequest();
    return !!request.headers.authorization;
  }
}

@ApiTags('AI Agent Registry')
@Controller('agents')
@UseGuards(SimpleAuthGuard)
@ApiBearerAuth()
export class AIAgentsController {
  constructor(private readonly aiAgentsService: AIAgentsService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new AI agent' })
  @ApiResponse({ status: 201, description: 'Agent registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data or insufficient tokens' })
  async registerAgent(@Request() req, @Body() registerAgentDto: RegisterAgentDto) {
    const userId = req.user?.id || 'default-user';
    return this.aiAgentsService.registerAgent(userId, registerAgentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all registered AI agents' })
  @ApiResponse({ status: 200, description: 'Agents retrieved successfully' })
  @ApiQuery({ name: 'agentType', required: false, description: 'Filter by agent type' })
  @ApiQuery({ name: 'capabilities', required: false, description: 'Filter by capabilities (comma-separated)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'isPublic', required: false, description: 'Filter by public status' })
  @ApiQuery({ name: 'ownerId', required: false, description: 'Filter by owner ID' })
  @ApiQuery({ name: 'tags', required: false, description: 'Filter by tags (comma-separated)' })
  @ApiQuery({ name: 'minRating', required: false, description: 'Minimum reputation rating' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in name and description' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results to return' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of results to skip' })
  async findAllAgents(
    @Query('agentType') agentType?: string,
    @Query('capabilities') capabilities?: string,
    @Query('status') status?: string,
    @Query('isPublic') isPublic?: string,
    @Query('ownerId') ownerId?: string,
    @Query('tags') tags?: string,
    @Query('minRating') minRating?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const filters = {
      agentType,
      capabilities: capabilities ? capabilities.split(',') : undefined,
      status,
      isPublic: isPublic ? isPublic === 'true' : undefined,
      ownerId,
      tags: tags ? tags.split(',') : undefined,
      minRating: minRating ? parseFloat(minRating) : undefined,
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    };

    return this.aiAgentsService.findAllAgents(filters);
  }

  @Get('my-agents')
  @ApiOperation({ summary: 'Get agents owned by the current user' })
  @ApiResponse({ status: 200, description: 'User agents retrieved successfully' })
  async getUserAgents(@Request() req) {
    const userId = req.user?.id || 'default-user';
    return this.aiAgentsService.getUserAgents(userId);
  }

  @Get('my-interactions')
  @ApiOperation({ summary: 'Get user interactions with agents' })
  @ApiResponse({ status: 200, description: 'User interactions retrieved successfully' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results to return' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of results to skip' })
  async getUserInteractions(
    @Request() req,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const userId = req.user?.id || 'default-user';
    return this.aiAgentsService.getUserInteractions(
      userId,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get('my-subscriptions')
  @ApiOperation({ summary: 'Get user agent subscriptions' })
  @ApiResponse({ status: 200, description: 'User subscriptions retrieved successfully' })
  async getUserSubscriptions(@Request() req) {
    const userId = req.user?.id || 'default-user';
    return this.aiAgentsService.getUserSubscriptions(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific agent by ID' })
  @ApiResponse({ status: 200, description: 'Agent retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  async findAgentById(@Param('id') id: string) {
    return this.aiAgentsService.findAgentById(id);
  }

  @Post('interact')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Interact with an AI agent' })
  @ApiResponse({ status: 200, description: 'Agent interaction completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or agent not found' })
  @ApiResponse({ status: 402, description: 'Insufficient AIM tokens' })
  async interactWithAgent(@Request() req, @Body() interactAgentDto: InteractAgentDto) {
    const userId = req.user?.id || 'default-user';
    return this.aiAgentsService.interactWithAgent(userId, interactAgentDto);
  }

  @Post('review')
  @ApiOperation({ summary: 'Review an AI agent' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data or not interacted' })
  async reviewAgent(@Request() req, @Body() reviewAgentDto: ReviewAgentDto) {
    const userId = req.user?.id || 'default-user';
    return this.aiAgentsService.reviewAgent(userId, reviewAgentDto);
  }

  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to an AI agent' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or already subscribed' })
  @ApiResponse({ status: 402, description: 'Insufficient AIM tokens' })
  async subscribeToAgent(@Request() req, @Body() subscribeAgentDto: SubscribeAgentDto) {
    const userId = req.user?.id || 'default-user';
    return this.aiAgentsService.subscribeToAgent(userId, subscribeAgentDto);
  }
}
