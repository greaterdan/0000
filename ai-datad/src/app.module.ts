import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIDataModule } from './ai-data/ai-data.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    AIDataModule,
  ],
})
export class AppModule {}
