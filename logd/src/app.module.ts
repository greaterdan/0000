import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { CheckpointController } from './checkpoint/checkpoint.controller';
import { CheckpointService } from './checkpoint/checkpoint.service';
import { MerkleService } from './merkle/merkle.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ScheduleModule.forRoot(),
    HttpModule,
  ],
  controllers: [CheckpointController],
  providers: [CheckpointService, MerkleService],
})
export class AppModule {}
