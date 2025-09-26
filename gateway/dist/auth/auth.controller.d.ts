import { AuthService } from './auth.service';
export declare class CreateDevAccountRequest {
    displayName: string;
    kind?: 'human' | 'agent';
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    createDevAccount(request: CreateDevAccountRequest): Promise<any>;
}
