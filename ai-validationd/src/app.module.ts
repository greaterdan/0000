import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIValidationModule } from './ai-validation/ai-validation.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    AIValidationModule,
  ],
})
export class AppModule {}
