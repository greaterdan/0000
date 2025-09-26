import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountKind } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

export interface RegisterAgentRequest {
  name: string;
  kind: 'service' | 'tool' | 'model';
  description?: string;
  capabilities?: string[];
}

export interface AgentRegistration {
  agentId: string;
  accountId: string;
  clientId: string;
  clientSecret: string;
  name: string;
  kind: string;
  createdAt: Date;
}

@Injectable()
export class AgentService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async registerAgent(request: RegisterAgentRequest): Promise<AgentRegistration> {
    // Check if agent name already exists
    const existingAgent = await this.prisma.account.findFirst({
      where: { displayName: request.name, kind: 'agent' },
    });

    if (existingAgent) {
      throw new ConflictException(`Agent with name '${request.name}' already exists`);
    }

    // Generate client credentials
    const clientId = uuidv4();
    const clientSecret = uuidv4();
    const hashedSecret = await bcrypt.hash(clientSecret, 12);

    // Create account directly
    const account = await this.prisma.account.create({
      data: {
        kind: 'agent' as AccountKind,
        displayName: request.name,
        reputationScore: 50.0, // Starting reputation
        tpmAttested: false,
      },
    });

    // Agent is now just an account with kind='agent'
    const agent = account;

    return {
      agentId: agent.id,
      accountId: agent.id,
      clientId: clientId,
      clientSecret,
      name: agent.displayName,
      kind: agent.kind,
      createdAt: agent.createdAt,
    };
  }

  async getAgentByClientId(clientId: string) {
    // For now, return null since we don't have clientId in Account table
    return null;
  }

  async getAgentById(agentId: string) {
    return this.prisma.account.findUnique({
      where: { id: agentId, kind: 'agent' },
    });
  }

  async validateClientCredentials(clientId: string, clientSecret: string): Promise<boolean> {
    // For now, return false since we don't have client credentials in Account table
    return false;
  }

  async updateAgentCapabilities(agentId: string, capabilities: string[]) {
    // Capabilities not stored in Account table, so just return the agent
    return this.prisma.account.findUnique({
      where: { id: agentId, kind: 'agent' },
    });
  }

  async deactivateAgent(agentId: string) {
    return this.prisma.account.update({
      where: { id: agentId },
      data: { status: 'suspended' },
    });
  }

  async listAgents(active?: boolean, kind?: string) {
    return this.prisma.account.findMany({
      where: {
        kind: 'agent',
        ...(active !== undefined && { status: active ? 'active' : 'suspended' }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
