import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  perAccount?: boolean;
}

interface User {
  account_id: string;
  agent_id: string;
  scopes: string[];
  kind: string;
}

interface RequestWithUser extends Request {
  user?: User;
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private requests = new Map<string, { count: number; resetTime: number }>();
  private readonly config: RateLimitConfig;

  constructor() {
    this.config = {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
      perAccount: process.env.RATE_LIMIT_PER_ACCOUNT === 'true',
    };
  }

  use(req: RequestWithUser, res: Response, next: NextFunction) {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Clean up old entries
    for (const [key, value] of this.requests.entries()) {
      if (value.resetTime < now) {
        this.requests.delete(key);
      }
    }

    // Determine rate limit key
    let key: string;
    if (this.config.perAccount && req.user?.account_id) {
      key = `account:${req.user.account_id}`;
    } else {
      key = `ip:${req.ip}`;
    }

    // Get or create rate limit entry
    const entry = this.requests.get(key) || { count: 0, resetTime: now + this.config.windowMs };
    
    // Check if limit exceeded
    if (entry.count >= this.config.maxRequests) {
      throw new HttpException(
        'Rate limit exceeded',
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    // Increment counter
    entry.count++;
    this.requests.set(key, entry);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', this.config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, this.config.maxRequests - entry.count));
    res.setHeader('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());

    next();
  }
}
