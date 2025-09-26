import { Module } from '@nestjs/common';
import { AIAgentsController } from './ai-agents.controller';
import { AIAgentsService } from './ai-agents.service';

@Module({
  controllers: [AIAgentsController],
  providers: [AIAgentsService],
  exports: [AIAgentsService],
})
export class AIAgentsModule {}
