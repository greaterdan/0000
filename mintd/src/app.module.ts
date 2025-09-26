import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from './prisma/prisma.module';
import { JobModule } from './job/job.module';
import { VerifierModule } from './verifier/verifier.module';
import { LedgerModule } from './ledger/ledger.module';
import { NatsModule } from './nats/nats.module';
import { MintOrchestratorService } from './mint-orchestrator.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    HttpModule,
    PrismaModule,
    JobModule,
    VerifierModule,
    LedgerModule,
    NatsModule,
  ],
  providers: [MintOrchestratorService],
})
export class AppModule {}
