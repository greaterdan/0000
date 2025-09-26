import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LedgerService } from './ledger.service';

@Module({
  imports: [HttpModule],
  providers: [LedgerService],
  exports: [LedgerService],
})
export class LedgerModule {}
