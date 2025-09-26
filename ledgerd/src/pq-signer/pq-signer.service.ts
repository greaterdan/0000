import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PqSignerService {
  private readonly pqSignerUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.pqSignerUrl = this.configService.get('PQSIGNER_URL', 'http://pqsigner:3000');
  }

  async sign(message: string, keyId: string, scheme: 'dilithium3' | 'sphincs-sha2-128f' = 'dilithium3'): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.pqSignerUrl}/sign`, {
          message_bytes_base64: Buffer.from(message, 'hex').toString('base64'),
          key_id: keyId,
          scheme,
        })
      );

      return response.data.sig_base64;
    } catch (error) {
      throw new BadRequestException(`Failed to sign message: ${error.message}`);
    }
  }

  async verify(
    message: string,
    signature: string,
    publicKey: string,
    scheme: 'dilithium3' | 'sphincs-sha2-128f' = 'dilithium3'
  ): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.pqSignerUrl}/verify`, {
          message,
          sig: signature,
          pubkey: publicKey,
          scheme,
        })
      );

      return response.data.valid;
    } catch (error) {
      throw new BadRequestException(`Failed to verify signature: ${error.message}`);
    }
  }

  async kemInit(peerPubkey: string): Promise<{ ciphertext: string; sharedSecret: string }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.pqSignerUrl}/kem/init`, {
          peer_pubkey: peerPubkey,
        })
      );

      return {
        ciphertext: response.data.ciphertext,
        sharedSecret: response.data.shared_secret,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to initialize KEM: ${error.message}`);
    }
  }
}
