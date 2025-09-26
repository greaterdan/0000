import { LogService } from './log.service';
export declare class LogController {
    private readonly logService;
    constructor(logService: LogService);
    getLatestCheckpoint(): Promise<any>;
    getProof(txId: string): Promise<any>;
    getConsistencyProof(oldCheckpoint: string, newCheckpoint: string): Promise<any>;
}
