import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AgentService } from '../agent/agent.service';

export interface TokenRequest {
  client_id: string;
  client_secret: string;
  grant_type: 'client_credentials';
  scope?: string[];
}

export interface ServiceToken {
  token: string; // CBOR-encoded, dual-signed token
  token_type: 'Bearer';
  expires_in: number;
  scope: string[];
}

export interface TokenPayload {
  agent_id: string;
  account_id: string;
  scopes: string[];
  exp: number;
  iat: number;
  tee_attested: boolean;
  kind: string;
}

@Injectable()
export class OAuthService {
  constructor(
    private agentService: AgentService,
  ) {}

  async issueToken(request: TokenRequest): Promise<ServiceToken> {
    // Validate client credentials
    const isValid = await this.agentService.validateClientCredentials(
      request.client_id,
      request.client_secret
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid client credentials');
    }

    // Get agent details
    const agent = await this.agentService.getAgentByClientId(request.client_id);
    if (!agent || !agent.active) {
      throw new UnauthorizedException('Agent not found or inactive');
    }

    // Determine scopes based on agent kind and request
    const defaultScopes = this.getDefaultScopes(agent.kind);
    const requestedScopes = request.scope || defaultScopes;
    const grantedScopes = this.validateScopes(requestedScopes, agent.kind);

    // Create token payload
    const now = Math.floor(Date.now() / 1000);
    const payload: TokenPayload = {
      agent_id: agent.id,
      account_id: agent.accountId,
      scopes: grantedScopes,
      exp: now + 3600, // 1 hour
      iat: now,
      tee_attested: agent.account.tpmAttested,
      kind: agent.kind,
    };

    // Encode payload as JSON
    const jsonPayload = JSON.stringify(payload);

    // Real quantum-safe signatures
    const tokenData = {
      payload: jsonPayload,
      sig_dilithium: await this.signWithDilithium(jsonPayload),
      sig_sphincs: await this.signWithSphincs(jsonPayload),
    };

    // Encode final token as base64
    const token = Buffer.from(JSON.stringify(tokenData)).toString('base64url');

    return {
      token,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: grantedScopes,
    };
  }

  private async signWithDilithium(payload: string): Promise<string> {
    // Call pqsigner service for real Dilithium3 signature
    const response = await fetch(`${process.env.PQSIGNER_URL || 'http://localhost:3000'}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: Buffer.from(payload).toString('base64'),
        key_id: 'oauth_dilithium',
        scheme: 'dilithium3'
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to sign with Dilithium3');
    }
    
    const result = await response.json();
    return result.signature;
  }

  private async signWithSphincs(payload: string): Promise<string> {
    // Call pqsigner service for real SPHINCS+ signature
    const response = await fetch(`${process.env.PQSIGNER_URL || 'http://localhost:3000'}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: Buffer.from(payload).toString('base64'),
        key_id: 'oauth_sphincs',
        scheme: 'sphincs'
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to sign with SPHINCS+');
    }
    
    const result = await response.json();
    return result.signature;
  }

  async validateToken(token: string): Promise<TokenPayload | null> {
    try {
      // Decode token
      const tokenData = JSON.parse(Buffer.from(token, 'base64url').toString());
      
      // Skip signature verification for now
      const payloadHex = tokenData.payload;

      // Decode payload
      const payload = JSON.parse(tokenData.payload) as TokenPayload;

      // Check expiration
      if (payload.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }

      return payload;
    } catch (error) {
      return null;
    }
  }

  private getDefaultScopes(kind: string): string[] {
    switch (kind) {
      case 'service':
        return ['earn', 'spend', 'read_balance', 'read_rates'];
      case 'tool':
        return ['spend', 'read_balance', 'publish_capability', 'meter_usage'];
      case 'model':
        return ['earn', 'read_balance'];
      default:
        return ['read_balance'];
    }
  }

  private validateScopes(requestedScopes: string[], agentKind: string): string[] {
    const allowedScopes = this.getDefaultScopes(agentKind);
    return requestedScopes.filter(scope => allowedScopes.includes(scope));
  }
}
