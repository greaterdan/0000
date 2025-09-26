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
exports.LogService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let LogService = class LogService {
    constructor(httpService) {
        this.httpService = httpService;
    }
    async getLatestCheckpoint() {
        const logdUrl = process.env.LOGD_URL || 'http://localhost:3002';
        const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${logdUrl}/v1/log/latest`));
        return response.data;
    }
    async getProof(txId) {
        const logdUrl = process.env.LOGD_URL || 'http://localhost:3002';
        const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${logdUrl}/v1/log/proof?tx_id=${txId}`));
        return response.data;
    }
    async getConsistencyProof(oldCheckpoint, newCheckpoint) {
        const logdUrl = process.env.LOGD_URL || 'http://localhost:3002';
        const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${logdUrl}/v1/log/consistency?old=${oldCheckpoint}&new=${newCheckpoint}`));
        return response.data;
    }
};
exports.LogService = LogService;
exports.LogService = LogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], LogService);
//# sourceMappingURL=log.service.js.map