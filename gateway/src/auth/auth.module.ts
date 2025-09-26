import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ServiceTokenGuard } from './service-token.guard';

@Module({
  imports: [HttpModule],
  providers: [AuthService, ServiceTokenGuard],
  controllers: [AuthController],
  exports: [AuthService, ServiceTokenGuard],
})
export class AuthModule {}
