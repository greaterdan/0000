import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DisputesService } from './disputes.service';
import { DisputesController } from './disputes.controller';

@Module({
  imports: [HttpModule],
  providers: [DisputesService],
  controllers: [DisputesController],
})
export class DisputesModule {}
