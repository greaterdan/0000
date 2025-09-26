import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIModelsModule } from './ai-models/ai-models.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    AIModelsModule,
  ],
})
export class AppModule {}
