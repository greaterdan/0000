import { Module } from '@nestjs/common';
import { AIDeploymentController } from './ai-deployment.controller';
import { AIDeploymentService } from './ai-deployment.service';

@Module({
  controllers: [AIDeploymentController],
  providers: [AIDeploymentService],
  exports: [AIDeploymentService],
})
export class AIDeploymentModule {}
