"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitGuard = void 0;
const common_1 = require("@nestjs/common");
let RateLimitGuard = class RateLimitGuard {
    constructor() {
        this.requests = new Map();
        this.maxRequests = parseInt(process.env.RATE_LIMIT_LIMIT || '100');
        this.windowMs = parseInt(process.env.RATE_LIMIT_TTL || '60000');
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const clientId = this.getClientId(request);
        const now = Date.now();
        const clientData = this.requests.get(clientId);
        if (!clientData || now > clientData.resetTime) {
            this.requests.set(clientId, {
                count: 1,
                resetTime: now + this.windowMs,
            });
            return true;
        }
        if (clientData.count >= this.maxRequests) {
            throw new common_1.HttpException({
                statusCode: common_1.HttpStatus.TOO_MANY_REQUESTS,
                message: 'Rate limit exceeded',
                retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
            }, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        clientData.count++;
        return true;
    }
    getClientId(request) {
        return request.ip || request.connection.remoteAddress || 'unknown';
    }
};
exports.RateLimitGuard = RateLimitGuard;
exports.RateLimitGuard = RateLimitGuard = __decorate([
    (0, common_1.Injectable)()
], RateLimitGuard);
//# sourceMappingURL=rate-limit.guard.js.map