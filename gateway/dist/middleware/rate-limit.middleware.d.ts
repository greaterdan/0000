import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
interface User {
    account_id: string;
    agent_id: string;
    scopes: string[];
    kind: string;
}
interface RequestWithUser extends Request {
    user?: User;
}
export declare class RateLimitMiddleware implements NestMiddleware {
    private requests;
    private readonly config;
    constructor();
    use(req: RequestWithUser, res: Response, next: NextFunction): void;
}
export {};
