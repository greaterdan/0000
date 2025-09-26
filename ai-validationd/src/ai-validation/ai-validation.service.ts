import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ValidateModelDto } from './dto/validate-model.dto';
import { CreateValidationTemplateDto } from './dto/create-template.dto';
import { CreateValidationBenchmarkDto } from './dto/create-benchmark.dto';
import axios from 'axios';

@Injectable()
export class AIValidationService {
  constructor(private prisma: PrismaService) {}

  async validateModel(userId: string, validateModelDto: ValidateModelDto) {
    const { modelId, validationType, testSuite, parameters = {}, templateId, benchmarkId, ...validationData } = validateModelDto;

    // Get model details
    const model = await this.prisma.aIModel.findUnique({
      where: { id: modelId, isActive: true },
      include: { validations: true },
    });

    if (!model) {
      throw new NotFoundException(`Model with ID ${modelId} not found or inactive`);
    }

    // Calculate validation cost
    const costAIM = this.calculateValidationCost(validationType, testSuite, parameters);

    // TODO: Check if user has enough AIM tokens
    await this.checkUserBalance(userId, costAIM);

    try {
      const startTime = Date.now();

      // Create validation record
      const validation = await this.prisma.aIModelValidation.create({
        data: {
          modelId,
          validatorId: userId,
          validationType,
          testSuite,
          costAIM: BigInt(costAIM),
          isPublic: validationData.isPublic ?? false,
          comments: validationData.comments,
          status: 'in_progress',
        },
      });

      // Run validation tests
      const results = await this.runValidationTests(model, validationType, testSuite, parameters, templateId, benchmarkId);

      const duration = Date.now() - startTime;
      const score = this.calculateValidationScore(results);
      const passedTests = results.filter(r => r.passed).length;
      const totalTests = results.length;

      // Update validation with results
      const updatedValidation = await this.prisma.aIModelValidation.update({
        where: { id: validation.id },
        data: {
          results,
          score,
          passedTests,
          totalTests,
          duration,
          status: 'completed',
          completedAt: new Date(),
          reportUrl: this.generateReportUrl(validation.id),
        },
        include: {
          model: {
            select: {
              id: true,
              name: true,
              modelType: true,
            },
          },
          validator: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
      });

      // Create test case records
      await this.prisma.aIModelTestCase.createMany({
        data: results.map(result => ({
          validationId: validation.id,
          testName: result.testName,
          testType: result.testType,
          input: result.input,
          expectedOutput: result.expectedOutput,
          actualOutput: result.actualOutput,
          passed: result.passed,
          score: result.score,
          errorMessage: result.errorMessage,
          duration: result.duration,
        })),
      });

      // Create validation report
      await this.prisma.aIModelValidationReport.create({
        data: {
          validationId: validation.id,
          reportType: 'summary',
          content: this.generateSummaryReport(updatedValidation, results),
          format: 'json',
          isPublic: validationData.isPublic ?? false,
        },
      });

      // TODO: Deduct AIM tokens from user
      await this.deductAIMTokens(userId, costAIM);

      return updatedValidation;
    } catch (error) {
      // Update validation as failed
      await this.prisma.aIModelValidation.update({
        where: { id: validation.id },
        data: {
          status: 'failed',
          completedAt: new Date(),
        },
      });

      throw new BadRequestException(`Model validation failed: ${error.message}`);
    }
  }

  async findAllValidations(filters?: {
    modelId?: string;
    validatorId?: string;
    validationType?: string;
    status?: string;
    isPublic?: boolean;
    minScore?: number;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.modelId) {
      where.modelId = filters.modelId;
    }

    if (filters?.validatorId) {
      where.validatorId = filters.validatorId;
    }

    if (filters?.validationType) {
      where.validationType = filters.validationType;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.isPublic !== undefined) {
      where.isPublic = filters.isPublic;
    }

    if (filters?.minScore) {
      where.score = {
        gte: filters.minScore,
      };
    }

    const [validations, total] = await Promise.all([
      this.prisma.aIModelValidation.findMany({
        where,
        include: {
          model: {
            select: {
              id: true,
              name: true,
              modelType: true,
            },
          },
          validator: {
            select: {
              id: true,
              displayName: true,
            },
          },
          _count: {
            select: {
              testCases: true,
            },
          },
        },
        orderBy: [
          { score: 'desc' },
          { createdAt: 'desc' },
        ],
        take: filters?.limit || 20,
        skip: filters?.offset || 0,
      }),
      this.prisma.aIModelValidation.count({ where }),
    ]);

    return {
      validations,
      total,
      limit: filters?.limit || 20,
      offset: filters?.offset || 0,
    };
  }

  async findValidationById(id: string) {
    const validation = await this.prisma.aIModelValidation.findUnique({
      where: { id },
      include: {
        model: {
          select: {
            id: true,
            name: true,
            modelType: true,
            version: true,
          },
        },
        validator: {
          select: {
            id: true,
            displayName: true,
          },
        },
        testCases: {
          orderBy: { createdAt: 'asc' },
        },
        validationReports: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!validation) {
      throw new NotFoundException(`Validation with ID ${id} not found`);
    }

    return validation;
  }

  async getUserValidations(userId: string) {
    return this.prisma.aIModelValidation.findMany({
      where: { validatorId: userId },
      include: {
        model: {
          select: {
            id: true,
            name: true,
            modelType: true,
          },
        },
        _count: {
          select: {
            testCases: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createValidationTemplate(createTemplateDto: CreateValidationTemplateDto) {
    return this.prisma.aIModelValidationTemplate.create({
      data: {
        ...createTemplateDto,
        costAIM: BigInt(createTemplateDto.costAIM || 100),
        tags: createTemplateDto.tags || [],
        isPublic: createTemplateDto.isPublic ?? true,
      },
    });
  }

  async findAllValidationTemplates(filters?: {
    validationType?: string;
    modelType?: string;
    isPublic?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.validationType) {
      where.validationType = filters.validationType;
    }

    if (filters?.modelType) {
      where.modelType = filters.modelType;
    }

    if (filters?.isPublic !== undefined) {
      where.isPublic = filters.isPublic;
    }

    const [templates, total] = await Promise.all([
      this.prisma.aIModelValidationTemplate.findMany({
        where,
        orderBy: [
          { usageCount: 'desc' },
          { rating: 'desc' },
          { createdAt: 'desc' },
        ],
        take: filters?.limit || 20,
        skip: filters?.offset || 0,
      }),
      this.prisma.aIModelValidationTemplate.count({ where }),
    ]);

    return {
      templates,
      total,
      limit: filters?.limit || 20,
      offset: filters?.offset || 0,
    };
  }

  async createValidationBenchmark(createBenchmarkDto: CreateValidationBenchmarkDto) {
    return this.prisma.aIModelValidationBenchmark.create({
      data: {
        ...createBenchmarkDto,
        isActive: createBenchmarkDto.isActive ?? true,
      },
    });
  }

  async findAllValidationBenchmarks(filters?: {
    modelType?: string;
    category?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.modelType) {
      where.modelType = filters.modelType;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const [benchmarks, total] = await Promise.all([
      this.prisma.aIModelValidationBenchmark.findMany({
        where,
        orderBy: [
          { usageCount: 'desc' },
          { createdAt: 'desc' },
        ],
        take: filters?.limit || 20,
        skip: filters?.offset || 0,
      }),
      this.prisma.aIModelValidationBenchmark.count({ where }),
    ]);

    return {
      benchmarks,
      total,
      limit: filters?.limit || 20,
      offset: filters?.offset || 0,
    };
  }

  async getValidationReport(validationId: string, reportType: string = 'summary') {
    const report = await this.prisma.aIModelValidationReport.findFirst({
      where: {
        validationId,
        reportType,
      },
      include: {
        validation: {
          include: {
            model: {
              select: {
                id: true,
                name: true,
                modelType: true,
              },
            },
            validator: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException(`Report not found for validation ${validationId}`);
    }

    return report;
  }

  private async runValidationTests(model: any, validationType: string, testSuite: any, parameters: any, templateId?: string, benchmarkId?: string): Promise<any[]> {
    // TODO: Implement actual validation test execution
    // For now, simulate validation tests
    const testCases = testSuite.testCases || 10;
    const results = [];

    for (let i = 0; i < testCases; i++) {
      const testResult = await this.runSingleTest(model, validationType, i, parameters);
      results.push(testResult);
    }

    return results;
  }

  private async runSingleTest(model: any, validationType: string, testIndex: number, parameters: any): Promise<any> {
    // Simulate test execution
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

    const passed = Math.random() > 0.2; // 80% pass rate
    const score = passed ? Math.random() * 0.4 + 0.6 : Math.random() * 0.4; // 0.6-1.0 if passed, 0.0-0.4 if failed

    return {
      testName: `${validationType}_test_${testIndex}`,
      testType: 'unit',
      input: { testInput: `input_${testIndex}` },
      expectedOutput: { expectedResult: 'valid' },
      actualOutput: { actualResult: passed ? 'valid' : 'invalid' },
      passed,
      score,
      errorMessage: passed ? null : `Test ${testIndex} failed validation`,
      duration: Math.floor(Math.random() * 1000) + 100,
    };
  }

  private calculateValidationScore(results: any[]): number {
    if (results.length === 0) return 0;
    
    const totalScore = results.reduce((sum, result) => sum + (result.score || 0), 0);
    return totalScore / results.length;
  }

  private calculateValidationCost(validationType: string, testSuite: any, parameters: any): number {
    let baseCost = 50; // Base validation cost in AIM tokens

    // Validation type multipliers
    const typeMultipliers = {
      'safety': 2.0,
      'performance': 1.5,
      'accuracy': 1.0,
      'bias': 1.5,
      'security': 2.5,
      'compliance': 2.0,
      'robustness': 1.8,
    };

    // Test suite complexity factor
    const testCases = testSuite.testCases || 10;
    const complexityCost = Math.ceil(testCases * 0.5);

    // Parameters complexity factor
    const parametersCost = Object.keys(parameters).length * 5;

    return Math.ceil(
      (baseCost + complexityCost + parametersCost) * typeMultipliers[validationType]
    );
  }

  private generateReportUrl(validationId: string): string {
    return `${process.env.VALIDATION_BASE_URL || 'https://validation.aim-currency.com'}/reports/${validationId}`;
  }

  private generateSummaryReport(validation: any, results: any[]): any {
    return {
      validationId: validation.id,
      modelId: validation.modelId,
      validationType: validation.validationType,
      score: validation.score,
      passedTests: validation.passedTests,
      totalTests: validation.totalTests,
      duration: validation.duration,
      summary: {
        overall: validation.score > 0.8 ? 'PASSED' : validation.score > 0.6 ? 'WARNING' : 'FAILED',
        recommendations: this.generateRecommendations(validation, results),
      },
      results: results.slice(0, 5), // Include first 5 test results
      generatedAt: new Date().toISOString(),
    };
  }

  private generateRecommendations(validation: any, results: any[]): string[] {
    const recommendations = [];

    if (validation.score < 0.6) {
      recommendations.push('Model validation failed. Consider retraining or adjusting parameters.');
    } else if (validation.score < 0.8) {
      recommendations.push('Model validation passed with warnings. Monitor performance in production.');
    } else {
      recommendations.push('Model validation passed successfully. Ready for production deployment.');
    }

    const failedTests = results.filter(r => !r.passed);
    if (failedTests.length > 0) {
      recommendations.push(`Address ${failedTests.length} failed test cases for improved performance.`);
    }

    return recommendations;
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
        memo: 'AI Model Validation Payment',
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_TOKEN}`,
        },
      });
    } catch (error) {
      console.error('Failed to deduct AIM tokens:', error.message);
    }
  }
}
