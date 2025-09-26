import { BalanceService } from './balance.service';
export declare class BalanceController {
    private readonly balanceService;
    constructor(balanceService: BalanceService);
    getBalance(req: any): Promise<any>;
}
