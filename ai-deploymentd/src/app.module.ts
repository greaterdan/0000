import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIDeploymentModule } from './ai-deployment/ai-deployment.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    AIDeploymentModule,
  ],
})
export class AppModule {}
