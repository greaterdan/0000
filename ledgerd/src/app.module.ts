import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from './prisma/prisma.module';
import { JournalModule } from './journal/journal.module';
import { AccountModule } from './account/account.module';
import { BalanceModule } from './balance/balance.module';
import { PqSignerModule } from './pq-signer/pq-signer.module';
import { DemurrageModule } from './demurrage/demurrage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ScheduleModule.forRoot(),
    HttpModule,
    PrismaModule,
    JournalModule,
    AccountModule,
    BalanceModule,
    PqSignerModule,
    DemurrageModule,
  ],
})
export class AppModule {}
