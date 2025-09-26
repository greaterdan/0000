import { BaseResponseDto } from '../../common/dto/base.dto';
export declare class BalanceDto {
    accountId: string;
    microAmount: string;
    amount: string;
    updatedAt: string;
    displayName?: string;
    accountKind?: string;
}
export declare class GetBalanceRequestDto {
    accountId?: string;
}
export declare class GetBalanceResponseDto extends BaseResponseDto {
    balance: BalanceDto;
}
export declare class GetMultipleBalancesRequestDto {
    accountIds: string[];
}
export declare class GetMultipleBalancesResponseDto extends BaseResponseDto {
    balances: BalanceDto[];
}
export declare class BalanceHistoryDto {
    accountId: string;
    balance: string;
    change: string;
    changeType: string;
    transactionId?: string;
    description?: string;
    timestamp: string;
}
export declare class GetBalanceHistoryRequestDto {
    accountId: string;
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    changeType?: string;
}
export declare class GetBalanceHistoryResponseDto extends BaseResponseDto {
    history: BalanceHistoryDto[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export declare class BalanceStatsDto {
    totalAccounts: number;
    totalSupply: string;
    totalSupplyFormatted: string;
    zeroBalanceAccounts: number;
    averageBalance: string;
    averageBalanceFormatted: string;
    topAccounts: BalanceDto[];
    distributionByType: Record<string, string>;
}
export declare class GetBalanceStatsResponseDto extends BaseResponseDto {
    stats: BalanceStatsDto;
}
export declare class ReserveBalanceRequestDto {
    accountId: string;
    microAmount: string;
    reason: string;
    expiresIn?: number;
}
export declare class ReserveBalanceResponseDto extends BaseResponseDto {
    reservationId: string;
    reservedAmount: string;
    expiresAt: string;
    availableBalance: string;
}
export declare class ReleaseReservationRequestDto {
    reservationId: string;
}
export declare class ReleaseReservationResponseDto extends BaseResponseDto {
    released: string;
    releasedAmount: string;
    availableBalance: string;
}
