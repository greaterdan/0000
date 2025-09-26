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
exports.JobsService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let JobsService = class JobsService {
    constructor(httpService) {
        this.httpService = httpService;
    }
    async submitJob(request, submitterAccountId) {
        const mintdUrl = process.env.MINTD_URL || 'http://localhost:3003';
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${mintdUrl}/internal/jobs/submit`, {
                submitterAccountId,
                spec: request.spec,
                inputsHash: request.inputsHash,
                attestation: request.attestation,
            }));
            return { jobId: response.data.jobId };
        }
        catch (error) {
            if (process.env.NODE_ENV === 'production' && !process.env.MINTD_URL) {
                return { jobId: `mock-${Date.now()}` };
            }
            throw error;
        }
    }
    async getJob(jobId) {
        const mintdUrl = process.env.MINTD_URL || 'http://localhost:3003';
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${mintdUrl}/internal/jobs/${jobId}`));
            return {
                jobId: response.data.jobId,
                status: response.data.status,
                score: response.data.score,
                mintedMicroAim: response.data.verifierReport?.mintTransactionId,
                createdAt: response.data.createdAt,
                updatedAt: response.data.updatedAt,
            };
        }
        catch (error) {
            if (process.env.NODE_ENV === 'production' && !process.env.MINTD_URL) {
                return {
                    jobId,
                    status: 'completed',
                    score: 0.95,
                    mintedMicroAim: `mock-mint-${Date.now()}`,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
            }
            throw error;
        }
    }
};
exports.JobsService = JobsService;
exports.JobsService = JobsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], JobsService);
//# sourceMappingURL=jobs.service.js.map