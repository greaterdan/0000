import { HttpService } from '@nestjs/axios';
export declare class LogService {
    private readonly httpService;
    constructor(httpService: HttpService);
    getLatestCheckpoint(): Promise<any>;
    getProof(txId: string): Promise<any>;
    getConsistencyProof(oldCheckpoint: string, newCheckpoint: string): Promise<any>;
}
