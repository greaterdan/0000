import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';
export declare const REQUIRED_SCOPES_KEY = "requiredScopes";
export declare const RequireScopes: (scopes: string[]) => import("@nestjs/common").CustomDecorator<string>;
export declare class ServiceTokenGuard implements CanActivate {
    private readonly authService;
    private readonly reflector;
    constructor(authService: AuthService, reflector: Reflector);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
