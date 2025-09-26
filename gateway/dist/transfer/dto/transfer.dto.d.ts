import { BaseResponseDto } from '../../common/dto/base.dto';
export declare enum TransferStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export declare enum TransferType {
    STANDARD = "standard",
    PRIORITY = "priority",
    BULK = "bulk"
}
export declare class TransferRequestDto {
    to: string;
    microAmount: string;
    memo?: string;
    type?: TransferType;
    reference?: string;
}
export declare class TransferResponseDto extends BaseResponseDto {
    transactionId: string;
    status: TransferStatus;
    amount: string;
    from: string;
    to: string;
    memo?: string;
    type: TransferType;
    reference?: string;
    timestamp: string;
    fee: string;
    blockHeight?: number;
}
export declare class TransferHistoryDto {
    transactionId: string;
    status: TransferStatus;
    amount: string;
    from: string;
    to: string;
    memo?: string;
    type: TransferType;
    timestamp: string;
    fee: string;
}
export declare class TransferHistoryRequestDto {
    page?: number;
    limit?: number;
    status?: TransferStatus;
    type?: TransferType;
    startDate?: string;
    endDate?: string;
}
export declare class TransferStatsDto {
    totalTransfers: number;
    totalVolume: string;
    totalFees: string;
    averageAmount: string;
    successRate: number;
    transfersByStatus: Record<TransferStatus, number>;
    transfersByType: Record<TransferType, number>;
}
export declare class TransferHistoryResponseDto extends BaseResponseDto {
    transfers: TransferHistoryDto[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export declare class TransferStatsResponseDto extends BaseResponseDto {
    stats: TransferStatsDto;
}
