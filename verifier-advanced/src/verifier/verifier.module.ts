import { Module } from '@nestjs/common';
import { VerifierService } from './verifier.service';
import { VerifierController } from './verifier.controller';

@Module({
  providers: [VerifierService],
  controllers: [VerifierController],
})
export class VerifierModule {}
