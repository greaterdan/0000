import { Controller, Post, Body } from '@nestjs/common';
import { VerifierService, ScoreRequest } from './verifier.service';

@Controller()
export class VerifierController {
  constructor(private readonly verifierService: VerifierService) {}

  @Post('score')
  async scoreJob(@Body() request: ScoreRequest) {
    return await this.verifierService.scoreJob(request);
  }

  @Post('health')
  async health() {
    return {
      status: 'healthy',
      service: 'verifier-advanced',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}
