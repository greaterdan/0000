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
exports.LogController = void 0;
const common_1 = require("@nestjs/common");
const log_service_1 = require("./log.service");
let LogController = class LogController {
    constructor(logService) {
        this.logService = logService;
    }
    async getLatestCheckpoint() {
        return await this.logService.getLatestCheckpoint();
    }
    async getProof(txId) {
        return await this.logService.getProof(txId);
    }
    async getConsistencyProof(oldCheckpoint, newCheckpoint) {
        return await this.logService.getConsistencyProof(oldCheckpoint, newCheckpoint);
    }
};
exports.LogController = LogController;
__decorate([
    (0, common_1.Get)('latest'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LogController.prototype, "getLatestCheckpoint", null);
__decorate([
    (0, common_1.Get)('proof'),
    __param(0, (0, common_1.Query)('tx_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LogController.prototype, "getProof", null);
__decorate([
    (0, common_1.Get)('consistency'),
    __param(0, (0, common_1.Query)('old')),
    __param(1, (0, common_1.Query)('new')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], LogController.prototype, "getConsistencyProof", null);
exports.LogController = LogController = __decorate([
    (0, common_1.Controller)('v1/log'),
    __metadata("design:paramtypes", [log_service_1.LogService])
], LogController);
//# sourceMappingURL=log.controller.js.map