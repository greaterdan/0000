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
exports.RateLimitMiddleware = void 0;
const common_1 = require("@nestjs/common");
let RateLimitMiddleware = class RateLimitMiddleware {
    constructor() {
        this.requests = new Map();
        this.config = {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
            maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
            perAccount: process.env.RATE_LIMIT_PER_ACCOUNT === 'true',
        };
    }
    use(req, res, next) {
        const now = Date.now();
        const windowStart = now - this.config.windowMs;
        for (const [key, value] of this.requests.entries()) {
            if (value.resetTime < now) {
                this.requests.delete(key);
            }
        }
        let key;
        if (this.config.perAccount && req.user?.account_id) {
            key = `account:${req.user.account_id}`;
        }
        else {
            key = `ip:${req.ip}`;
        }
        const entry = this.requests.get(key) || { count: 0, resetTime: now + this.config.windowMs };
        if (entry.count >= this.config.maxRequests) {
            throw new common_1.HttpException('Rate limit exceeded', common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        entry.count++;
        this.requests.set(key, entry);
        res.setHeader('X-RateLimit-Limit', this.config.maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, this.config.maxRequests - entry.count));
        res.setHeader('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());
        next();
    }
};
exports.RateLimitMiddleware = RateLimitMiddleware;
exports.RateLimitMiddleware = RateLimitMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], RateLimitMiddleware);
//# sourceMappingURL=rate-limit.middleware.js.map