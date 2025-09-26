import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LogService } from './log.service';
import { LogController } from './log.controller';

@Module({
  imports: [HttpModule],
  providers: [LogService],
  controllers: [LogController],
})
export class LogModule {}
