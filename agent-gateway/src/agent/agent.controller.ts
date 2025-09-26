import { Controller, Post, Get, Put, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { AgentService, RegisterAgentRequest } from './agent.service';

@Controller('agents')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('register')
  async registerAgent(@Body() request: RegisterAgentRequest) {
    try {
      return await this.agentService.registerAgent(request);
    } catch (error) {
      throw new BadRequestException(`Failed to register agent: ${error.message}`);
    }
  }

  @Get(':agentId')
  async getAgent(@Param('agentId') agentId: string) {
    return this.agentService.getAgentById(agentId);
  }

  @Get()
  async listAgents(
    @Query('active') active?: boolean,
    @Query('kind') kind?: string,
  ) {
    return this.agentService.listAgents(active, kind);
  }

  @Put(':agentId/capabilities')
  async updateCapabilities(
    @Param('agentId') agentId: string,
    @Body('capabilities') capabilities: string[],
  ) {
    return this.agentService.updateAgentCapabilities(agentId, capabilities);
  }

  @Put(':agentId/deactivate')
  async deactivateAgent(@Param('agentId') agentId: string) {
    return this.agentService.deactivateAgent(agentId);
  }
}
