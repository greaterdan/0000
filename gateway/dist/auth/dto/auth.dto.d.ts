import { BaseResponseDto } from '../../common/dto/base.dto';
export declare enum AccountKind {
    HUMAN = "human",
    AGENT = "agent",
    TREASURY = "treasury"
}
export declare enum TokenType {
    BEARER = "Bearer",
    API_KEY = "api_key"
}
export declare class CreateAccountRequestDto {
    displayName: string;
    kind: AccountKind;
    email?: string;
    description?: string;
}
export declare class CreateAccountResponseDto extends BaseResponseDto {
    apiKey: string;
    accountId: string;
    displayName: string;
    kind: AccountKind;
    email?: string;
    description?: string;
    scopes: string[];
    createdAt: string;
    reputationScore: string;
}
export declare class ValidateTokenRequestDto {
    token: string;
}
export declare class ValidateTokenResponseDto extends BaseResponseDto {
    valid: boolean;
    payload?: {
        account_id: string;
        scopes: string[];
        kind: string;
        iat: number;
        exp: number;
    };
    error?: string;
}
export declare class RefreshTokenRequestDto {
    refreshToken: string;
}
export declare class RefreshTokenResponseDto extends BaseResponseDto {
    accessToken: string;
    refreshToken: string;
    tokenType: TokenType;
    expiresIn: string;
}
export declare class RevokeTokenRequestDto {
    token: string;
}
export declare class RevokeTokenResponseDto extends BaseResponseDto {
    revoked: boolean;
    revokedAt: string;
}
export declare class AccountInfoDto {
    accountId: string;
    displayName: string;
    kind: AccountKind;
    email?: string;
    description?: string;
    scopes: string[];
    createdAt: string;
    updatedAt: string;
    reputationScore: string;
    status: string;
    tpmAttested: boolean;
}
export declare class UpdateAccountRequestDto {
    displayName?: string;
    email?: string;
    description?: string;
}
export declare class UpdateAccountResponseDto extends BaseResponseDto {
    account: AccountInfoDto;
}
