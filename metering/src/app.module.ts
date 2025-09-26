import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { UsageController } from './usage/usage.controller';
import { UsageService } from './usage/usage.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    HttpModule,
  ],
  controllers: [UsageController],
  providers: [UsageService],
})
export class AppModule {}
