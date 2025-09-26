import { HttpService } from '@nestjs/axios';
export declare class TransferRequest {
    to: string;
    microAmount: string;
    memo?: string;
}
export declare class TransferService {
    private readonly httpService;
    constructor(httpService: HttpService);
    transfer(request: TransferRequest, fromAccountId: string): Promise<any>;
    getTransferHistory(accountId: string, query: any): Promise<any>;
    getTransferStats(accountId: string): Promise<any>;
    getTransfer(transactionId: string, accountId: string): Promise<any>;
}
