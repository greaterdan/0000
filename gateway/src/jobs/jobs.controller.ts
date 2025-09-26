import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JobsService, JobSubmitRequest } from './jobs.service';
import { ServiceTokenGuard, RequireScopes } from '../auth/service-token.guard';

@Controller('v1/jobs')
@UseGuards(ServiceTokenGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post('submit')
  @RequireScopes(['earn'])
  async submitJob(@Body() request: JobSubmitRequest, @Request() req) {
    // The ServiceTokenGuard ensures this is an agent with 'earn' scope
    const submitterAccountId = req.user.account_id;
    
    return await this.jobsService.submitJob(request, submitterAccountId);
  }

  @Get(':jobId')
  async getJob(@Param('jobId') jobId: string) {
    return await this.jobsService.getJob(jobId);
  }
}
