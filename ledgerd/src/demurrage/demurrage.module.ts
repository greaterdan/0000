import { Module } from '@nestjs/common';
import { DemurrageService } from './demurrage.service';
import { BalanceModule } from '../balance/balance.module';

@Module({
  imports: [BalanceModule],
  providers: [DemurrageService],
  exports: [DemurrageService],
})
export class DemurrageModule {}
