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
import { AIValidationService } from './ai-validation.service';
import { ValidateModelDto } from './dto/validate-model.dto';
import { CreateValidationTemplateDto } from './dto/create-template.dto';
import { CreateValidationBenchmarkDto } from './dto/create-benchmark.dto';

// Simple auth guard - in production, integrate with proper JWT auth
class SimpleAuthGuard {
  canActivate(context: any): boolean {
    const request = context.switchToHttp().getRequest();
    return !!request.headers.authorization;
  }
}

@ApiTags('AI Model Validation')
@Controller('validation')
@UseGuards(SimpleAuthGuard)
@ApiBearerAuth()
export class AIValidationController {
  constructor(private readonly aiValidationService: AIValidationService) {}

  @Post('validate')
  @ApiOperation({ summary: 'Validate an AI model' })
  @ApiResponse({ status: 201, description: 'Model validation started successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data or insufficient tokens' })
  @ApiResponse({ status: 404, description: 'Model not found' })
  async validateModel(@Request() req, @Body() validateModelDto: ValidateModelDto) {
    const userId = req.user?.id || 'default-user';
    return this.aiValidationService.validateModel(userId, validateModelDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all model validations' })
  @ApiResponse({ status: 200, description: 'Validations retrieved successfully' })
  @ApiQuery({ name: 'modelId', required: false, description: 'Filter by model ID' })
  @ApiQuery({ name: 'validatorId', required: false, description: 'Filter by validator ID' })
  @ApiQuery({ name: 'validationType', required: false, description: 'Filter by validation type' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'isPublic', required: false, description: 'Filter by public status' })
  @ApiQuery({ name: 'minScore', required: false, description: 'Minimum validation score' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results to return' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of results to skip' })
  async findAllValidations(
    @Query('modelId') modelId?: string,
    @Query('validatorId') validatorId?: string,
    @Query('validationType') validationType?: string,
    @Query('status') status?: string,
    @Query('isPublic') isPublic?: string,
    @Query('minScore') minScore?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const filters = {
      modelId,
      validatorId,
      validationType,
      status,
      isPublic: isPublic ? isPublic === 'true' : undefined,
      minScore: minScore ? parseFloat(minScore) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    };

    return this.aiValidationService.findAllValidations(filters);
  }

  @Get('my-validations')
  @ApiOperation({ summary: 'Get validations performed by the current user' })
  @ApiResponse({ status: 200, description: 'User validations retrieved successfully' })
  async getUserValidations(@Request() req) {
    const userId = req.user?.id || 'default-user';
    return this.aiValidationService.getUserValidations(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific validation by ID' })
  @ApiResponse({ status: 200, description: 'Validation retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Validation not found' })
  @ApiParam({ name: 'id', description: 'Validation ID' })
  async findValidationById(@Param('id') id: string) {
    return this.aiValidationService.findValidationById(id);
  }

  @Get(':id/report')
  @ApiOperation({ summary: 'Get validation report' })
  @ApiResponse({ status: 200, description: 'Report retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  @ApiParam({ name: 'id', description: 'Validation ID' })
  @ApiQuery({ name: 'type', required: false, description: 'Report type (summary, detailed, compliance)' })
  async getValidationReport(
    @Param('id') id: string,
    @Query('type') type?: string,
  ) {
    return this.aiValidationService.getValidationReport(id, type || 'summary');
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create a validation template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createValidationTemplate(@Body() createTemplateDto: CreateValidationTemplateDto) {
    return this.aiValidationService.createValidationTemplate(createTemplateDto);
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get all validation templates' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  @ApiQuery({ name: 'validationType', required: false, description: 'Filter by validation type' })
  @ApiQuery({ name: 'modelType', required: false, description: 'Filter by model type' })
  @ApiQuery({ name: 'isPublic', required: false, description: 'Filter by public status' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results to return' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of results to skip' })
  async findAllValidationTemplates(
    @Query('validationType') validationType?: string,
    @Query('modelType') modelType?: string,
    @Query('isPublic') isPublic?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const filters = {
      validationType,
      modelType,
      isPublic: isPublic ? isPublic === 'true' : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    };

    return this.aiValidationService.findAllValidationTemplates(filters);
  }

  @Post('benchmarks')
  @ApiOperation({ summary: 'Create a validation benchmark' })
  @ApiResponse({ status: 201, description: 'Benchmark created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createValidationBenchmark(@Body() createBenchmarkDto: CreateValidationBenchmarkDto) {
    return this.aiValidationService.createValidationBenchmark(createBenchmarkDto);
  }

  @Get('benchmarks')
  @ApiOperation({ summary: 'Get all validation benchmarks' })
  @ApiResponse({ status: 200, description: 'Benchmarks retrieved successfully' })
  @ApiQuery({ name: 'modelType', required: false, description: 'Filter by model type' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results to return' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of results to skip' })
  async findAllValidationBenchmarks(
    @Query('modelType') modelType?: string,
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const filters = {
      modelType,
      category,
      isActive: isActive ? isActive === 'true' : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    };

    return this.aiValidationService.findAllValidationBenchmarks(filters);
  }
}
