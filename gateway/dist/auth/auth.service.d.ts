import { HttpService } from '@nestjs/axios';
export interface ServiceTokenPayload {
    agent_id: string;
    account_id: string;
    scopes: string[];
    exp: number;
    iat: number;
    tee_attested: boolean;
    kind: string;
}
export interface TokenValidationResult {
    valid: boolean;
    payload?: ServiceTokenPayload;
    error?: string;
}
export declare class AuthService {
    private readonly httpService;
    constructor(httpService: HttpService);
    validateServiceToken(token: string): Promise<TokenValidationResult>;
    private verifySignature;
    createDevAccount(displayName: string, kind?: 'human' | 'agent'): Promise<any>;
}
