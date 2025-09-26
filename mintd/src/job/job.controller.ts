import { Controller, Post, Get, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { JobService, SubmitJobRequest } from './job.service';
import { JobStatus } from '@prisma/client';

@Controller('internal/jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post('submit')
  async submitJob(@Body() request: SubmitJobRequest) {
    try {
      return await this.jobService.submitJob(request);
    } catch (error) {
      throw new BadRequestException(`Failed to submit job: ${error.message}`);
    }
  }

  @Get(':jobId')
  async getJob(@Param('jobId') jobId: string) {
    return this.jobService.getJob(jobId);
  }

  @Get()
  async listJobs(
    @Query('submitterAccountId') submitterAccountId?: string,
    @Query('status') status?: JobStatus,
    @Query('limit') limit?: number,
  ) {
    return this.jobService.listJobs(submitterAccountId, status, limit || 100);
  }

  @Get('status/:status')
  async getJobsByStatus(@Param('status') status: JobStatus) {
    return this.jobService.getJobsByStatus(status);
  }

  @Get('submitter/:submitterAccountId')
  async getJobsBySubmitter(@Param('submitterAccountId') submitterAccountId: string) {
    return this.jobService.getJobsBySubmitter(submitterAccountId);
  }
}
