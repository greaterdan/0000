import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService, ServiceTokenPayload } from './auth.service';

export const REQUIRED_SCOPES_KEY = 'requiredScopes';
export const RequireScopes = (scopes: string[]) => SetMetadata(REQUIRED_SCOPES_KEY, scopes);

@Injectable()
export class ServiceTokenGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const requiredScopes = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_SCOPES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Extract token from Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer token required');
    }

    const token = authHeader.substring(7);
    const validation = await this.authService.validateServiceToken(token);

    if (!validation.valid) {
      throw new UnauthorizedException(validation.error || 'Invalid token');
    }

    const payload = validation.payload!;

    // Check if account is an agent (for AI-only operations)
    if (requiredScopes?.includes('earn') && payload.kind !== 'agent') {
      throw new ForbiddenException('AI agents only - earn scope requires agent account');
    }

    // Check required scopes
    if (requiredScopes) {
      const hasRequiredScopes = requiredScopes.every(scope => 
        payload.scopes.includes(scope)
      );
      
      if (!hasRequiredScopes) {
        throw new ForbiddenException(`Required scopes: ${requiredScopes.join(', ')}`);
      }
    }

    // Attach payload to request for use in controllers
    request.user = payload;
    return true;
  }
}
