import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OnrampService } from './onramp.service';
import { OnrampController } from './onramp.controller';

@Module({
  imports: [HttpModule],
  providers: [OnrampService],
  controllers: [OnrampController],
})
export class OnrampModule {}
