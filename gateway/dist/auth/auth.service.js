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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const cbor = require("cbor");
let AuthService = class AuthService {
    constructor(httpService) {
        this.httpService = httpService;
    }
    async validateServiceToken(token) {
        try {
            const tokenData = cbor.decode(Buffer.from(token, 'base64url'));
            const payloadHex = tokenData.payload.toString('hex');
            const [dilithiumValid, sphincsValid] = await Promise.all([
                this.verifySignature(payloadHex, tokenData.sig_dilithium, 'dilithium3'),
                this.verifySignature(payloadHex, tokenData.sig_sphincs, 'sphincs-sha2-128f'),
            ]);
            if (!dilithiumValid || !sphincsValid) {
                return { valid: false, error: 'Invalid token signatures' };
            }
            const payload = cbor.decode(tokenData.payload);
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp < now) {
                return { valid: false, error: 'Token expired' };
            }
            return { valid: true, payload };
        }
        catch (error) {
            return { valid: false, error: 'Invalid token format' };
        }
    }
    async verifySignature(message, signature, scheme) {
        try {
            const pqsignerUrl = process.env.PQSIGNER_URL || 'http://localhost:3000';
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${pqsignerUrl}/verify`, {
                message,
                sig: signature.toString('base64'),
                pubkey: 'dummy_pubkey',
                scheme,
            }));
            return response.data.valid;
        }
        catch (error) {
            console.error('Signature verification failed:', error);
            return false;
        }
    }
    async createDevAccount(displayName, kind = 'human') {
        if (process.env.NODE_ENV === 'production') {
            throw new common_1.UnauthorizedException('Dev accounts disabled in production');
        }
        const ledgerdUrl = process.env.LEDGERD_URL || 'http://localhost:3001';
        const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${ledgerdUrl}/internal/accounts`, {
            displayName,
            kind,
        }));
        return response.data;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], AuthService);
//# sourceMappingURL=auth.service.js.map