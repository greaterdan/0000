import { RatesService } from './rates.service';
export declare class RatesController {
    private readonly ratesService;
    constructor(ratesService: RatesService);
    getRates(): Promise<any>;
}
