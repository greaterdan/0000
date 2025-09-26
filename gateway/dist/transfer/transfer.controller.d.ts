import { TransferService } from './transfer.service';
import { TransferRequestDto, TransferResponseDto, TransferHistoryRequestDto, TransferHistoryResponseDto, TransferStatsResponseDto } from './dto/transfer.dto';
export declare class TransferController {
    private readonly transferService;
    constructor(transferService: TransferService);
    transfer(request: TransferRequestDto, req: any): Promise<TransferResponseDto>;
    getTransferHistory(query: TransferHistoryRequestDto, req: any): Promise<TransferHistoryResponseDto>;
    getTransferStats(req: any): Promise<TransferStatsResponseDto>;
    getTransfer(transactionId: string, req: any): Promise<TransferResponseDto>;
}
