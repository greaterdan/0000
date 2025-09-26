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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsController = void 0;
const common_1 = require("@nestjs/common");
const jobs_service_1 = require("./jobs.service");
const service_token_guard_1 = require("../auth/service-token.guard");
let JobsController = class JobsController {
    constructor(jobsService) {
        this.jobsService = jobsService;
    }
    async submitJob(request, req) {
        const submitterAccountId = req.user.account_id;
        return await this.jobsService.submitJob(request, submitterAccountId);
    }
    async getJob(jobId) {
        return await this.jobsService.getJob(jobId);
    }
};
exports.JobsController = JobsController;
__decorate([
    (0, common_1.Post)('submit'),
    (0, service_token_guard_1.RequireScopes)(['earn']),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], JobsController.prototype, "submitJob", null);
__decorate([
    (0, common_1.Get)(':jobId'),
    __param(0, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], JobsController.prototype, "getJob", null);
exports.JobsController = JobsController = __decorate([
    (0, common_1.Controller)('v1/jobs'),
    (0, common_1.UseGuards)(service_token_guard_1.ServiceTokenGuard),
    __metadata("design:paramtypes", [jobs_service_1.JobsService])
], JobsController);
//# sourceMappingURL=jobs.controller.js.map