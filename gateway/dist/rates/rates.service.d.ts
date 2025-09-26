import { HttpService } from '@nestjs/axios';
export declare class RatesService {
    private readonly httpService;
    constructor(httpService: HttpService);
    getRates(): Promise<any>;
}
