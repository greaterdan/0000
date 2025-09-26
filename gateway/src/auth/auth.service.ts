import { Injectable, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as cbor from 'cbor';

export interface ServiceTokenPayload {
  agent_id: string;
  account_id: string;
  scopes: string[];
  exp: number;
  iat: number;
  tee_attested: boolean;
  kind: string;
}

export interface TokenValidationResult {
  valid: boolean;
  payload?: ServiceTokenPayload;
  error?: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly httpService: HttpService) {}

  async validateServiceToken(token: string): Promise<TokenValidationResult> {
    try {
      // Decode the CBOR token
      const tokenData = cbor.decode(Buffer.from(token, 'base64url'));
      
      // Verify dual signatures
      const payloadHex = tokenData.payload.toString('hex');
      const [dilithiumValid, sphincsValid] = await Promise.all([
        this.verifySignature(payloadHex, tokenData.sig_dilithium, 'dilithium3'),
        this.verifySignature(payloadHex, tokenData.sig_sphincs, 'sphincs-sha2-128f'),
      ]);

      if (!dilithiumValid || !sphincsValid) {
        return { valid: false, error: 'Invalid token signatures' };
      }

      // Decode payload
      const payload: ServiceTokenPayload = cbor.decode(tokenData.payload);

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        return { valid: false, error: 'Token expired' };
      }

      return { valid: true, payload };
    } catch (error) {
      return { valid: false, error: 'Invalid token format' };
    }
  }

  private async verifySignature(
    message: string,
    signature: Buffer,
    scheme: string
  ): Promise<boolean> {
    try {
      const pqsignerUrl = process.env.PQSIGNER_URL || 'http://localhost:3000';
      const response = await firstValueFrom(
        this.httpService.post(`${pqsignerUrl}/verify`, {
          message,
          sig: signature.toString('base64'),
          pubkey: 'dummy_pubkey', // In production, use actual public key
          scheme,
        })
      );
      return response.data.valid;
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  async createDevAccount(displayName: string, kind: 'human' | 'agent' = 'human') {
    // This should be disabled in production
    if (process.env.NODE_ENV === 'production') {
      throw new UnauthorizedException('Dev accounts disabled in production');
    }

    const ledgerdUrl = process.env.LEDGERD_URL || 'http://localhost:3001';
    const response = await firstValueFrom(
      this.httpService.post(`${ledgerdUrl}/internal/accounts`, {
        displayName,
        kind,
      })
    );
    return response.data;
  }
}
