import { HttpService } from '@nestjs/axios';
export declare class BalanceService {
    private readonly httpService;
    constructor(httpService: HttpService);
    getBalance(accountId: string): Promise<any>;
}
