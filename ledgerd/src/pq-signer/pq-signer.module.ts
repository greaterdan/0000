import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PqSignerService } from './pq-signer.service';

@Module({
  imports: [HttpModule],
  providers: [PqSignerService],
  exports: [PqSignerService],
})
export class PqSignerModule {}
