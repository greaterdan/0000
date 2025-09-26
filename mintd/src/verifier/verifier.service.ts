import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface ScoreRequest {
  jobId: string;
  inputsHash: string;
  spec: Record<string, any>;
}

export interface ScoreResponse {
  score: number;
  report: Record<string, any>;
}

@Injectable()
export class VerifierService {
  private readonly verifierUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.verifierUrl = this.configService.get('VERIFIER_URL', 'http://verifier-simple:3006');
  }

  async scoreJob(request: ScoreRequest): Promise<ScoreResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.verifierUrl}/score`, {
          job_id: request.jobId,
          inputs_hash: request.inputsHash,
          spec: request.spec,
        })
      );

      return {
        score: response.data.score,
        report: response.data.report,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to score job: ${error.message}`);
    }
  }

  async getHealth(): Promise<{ status: string; version: string; models_loaded: string[] }> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.verifierUrl}/health`)
      );

      return response.data;
    } catch (error) {
      throw new BadRequestException(`Failed to get verifier health: ${error.message}`);
    }
  }
}
