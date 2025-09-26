import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIContentModule } from './ai-content/ai-content.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    AIContentModule,
  ],
})
export class AppModule {}
