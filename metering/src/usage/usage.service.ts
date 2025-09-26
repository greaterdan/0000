import { Injectable } from '@nestjs/common';

export interface StartUsageRequest {
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, any>;
}

export interface TickUsageRequest {
  sessionId: string;
  units: number;
  metadata?: Record<string, any>;
}

export interface CloseUsageRequest {
  sessionId: string;
  finalUnits?: number;
  metadata?: Record<string, any>;
}

@Injectable()
export class UsageService {
  async startUsage(request: StartUsageRequest, accountId: string) {
    return {
      sessionId: 'mock-session-id',
      accountId,
      resourceType: request.resourceType,
      resourceId: request.resourceId,
      startTime: new Date().toISOString(),
      metadata: request.metadata,
    };
  }

  async tickUsage(request: TickUsageRequest) {
    return {
      sessionId: request.sessionId,
      units: request.units,
      timestamp: new Date().toISOString(),
      metadata: request.metadata,
    };
  }

  async closeUsage(request: CloseUsageRequest) {
    return {
      sessionId: request.sessionId,
      finalUnits: request.finalUnits || 0,
      endTime: new Date().toISOString(),
      metadata: request.metadata,
    };
  }

  async getUsageSession(sessionId: string) {
    return {
      sessionId,
      accountId: 'mock-account-id',
      resourceType: 'mock-resource',
      resourceId: 'mock-resource-id',
      startTime: new Date().toISOString(),
      endTime: null,
      totalUnits: 0,
      metadata: {},
    };
  }

  async getUsageHistory() {
    return {
      sessions: [],
      totalUnits: 0,
      totalSessions: 0,
    };
  }
}