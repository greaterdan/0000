import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { CheckpointService } from './checkpoint.service';

export interface WitnessCosignRequest {
  checkpointId: string;
  witnessName: string;
  signature: {
    dilithium: string;
    sphincs: string;
  };
}

@Controller('v1/log')
export class CheckpointController {
  constructor(private readonly checkpointService: CheckpointService) {}

  @Get('latest')
  async getLatestCheckpoint() {
    return await this.checkpointService.getLatestCheckpoint();
  }

  @Get('checkpoint/:id')
  async getCheckpoint(@Param('id') id: string) {
    return await this.checkpointService.getCheckpointById(id);
  }

  @Get('proof')
  async getProof(@Query('tx_id') txId: string) {
    return await this.checkpointService.getProofForTransaction(txId);
  }

  @Get('consistency')
  async getConsistencyProof(
    @Query('old') oldCheckpoint: string,
    @Query('new') newCheckpoint: string
  ) {
    return await this.checkpointService.getConsistencyProof(oldCheckpoint, newCheckpoint);
  }

  @Post('witness/cosign')
  async witnessCosign(@Body() request: WitnessCosignRequest) {
    return await this.checkpointService.addWitnessSignature(
      request.checkpointId,
      request.witnessName,
      request.signature
    );
  }

  @Get('witness/status/:checkpointId')
  async getWitnessStatus(@Param('checkpointId') checkpointId: string) {
    return await this.checkpointService.getWitnessStatus(checkpointId);
  }

  @Post('anchors/:checkpointId')
  async publishAnchors(@Param('checkpointId') checkpointId: string) {
    return await this.checkpointService.publishAnchors(checkpointId);
  }
}
