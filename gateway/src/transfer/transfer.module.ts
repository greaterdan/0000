import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TransferService } from './transfer.service';
import { TransferController } from './transfer.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [HttpModule, AuthModule],
  providers: [TransferService],
  controllers: [TransferController],
})
export class TransferModule {}
