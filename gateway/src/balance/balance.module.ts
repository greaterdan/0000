import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BalanceService } from './balance.service';
import { BalanceController } from './balance.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [HttpModule, AuthModule],
  providers: [BalanceService],
  controllers: [BalanceController],
})
export class BalanceModule {}
