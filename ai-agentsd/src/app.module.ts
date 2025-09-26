import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIAgentsModule } from './ai-agents/ai-agents.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    AIAgentsModule,
  ],
})
export class AppModule {}
