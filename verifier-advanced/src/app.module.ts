import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VerifierModule } from './verifier/verifier.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    VerifierModule,
  ],
})
export class AppModule {}
