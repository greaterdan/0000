import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { VerifierService } from './verifier.service';

@Module({
  imports: [HttpModule],
  providers: [VerifierService],
  exports: [VerifierService],
})
export class VerifierModule {}
