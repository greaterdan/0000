"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceTokenGuard = exports.RequireScopes = exports.REQUIRED_SCOPES_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const auth_service_1 = require("./auth.service");
exports.REQUIRED_SCOPES_KEY = 'requiredScopes';
const RequireScopes = (scopes) => (0, common_1.SetMetadata)(exports.REQUIRED_SCOPES_KEY, scopes);
exports.RequireScopes = RequireScopes;
let ServiceTokenGuard = class ServiceTokenGuard {
    constructor(authService, reflector) {
        this.authService = authService;
        this.reflector = reflector;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const requiredScopes = this.reflector.getAllAndOverride(exports.REQUIRED_SCOPES_KEY, [context.getHandler(), context.getClass()]);
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('Bearer token required');
        }
        const token = authHeader.substring(7);
        const validation = await this.authService.validateServiceToken(token);
        if (!validation.valid) {
            throw new common_1.UnauthorizedException(validation.error || 'Invalid token');
        }
        const payload = validation.payload;
        if (requiredScopes?.includes('earn') && payload.kind !== 'agent') {
            throw new common_1.ForbiddenException('AI agents only - earn scope requires agent account');
        }
        if (requiredScopes) {
            const hasRequiredScopes = requiredScopes.every(scope => payload.scopes.includes(scope));
            if (!hasRequiredScopes) {
                throw new common_1.ForbiddenException(`Required scopes: ${requiredScopes.join(', ')}`);
            }
        }
        request.user = payload;
        return true;
    }
};
exports.ServiceTokenGuard = ServiceTokenGuard;
exports.ServiceTokenGuard = ServiceTokenGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        core_1.Reflector])
], ServiceTokenGuard);
//# sourceMappingURL=service-token.guard.js.map