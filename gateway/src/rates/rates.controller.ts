import { Controller, Get } from '@nestjs/common';
import { RatesService } from './rates.service';

@Controller('v1/rates')
export class RatesController {
  constructor(private readonly ratesService: RatesService) {}

  @Get()
  async getRates() {
    return await this.ratesService.getRates();
  }
}
