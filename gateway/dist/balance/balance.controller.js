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
exports.BalanceController = void 0;
const common_1 = require("@nestjs/common");
const balance_service_1 = require("./balance.service");
const service_token_guard_1 = require("../auth/service-token.guard");
let BalanceController = class BalanceController {
    constructor(balanceService) {
        this.balanceService = balanceService;
    }
    async getBalance(req) {
        const accountId = req.user.account_id;
        return await this.balanceService.getBalance(accountId);
    }
};
exports.BalanceController = BalanceController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BalanceController.prototype, "getBalance", null);
exports.BalanceController = BalanceController = __decorate([
    (0, common_1.Controller)('v1/balance'),
    (0, common_1.UseGuards)(service_token_guard_1.ServiceTokenGuard),
    __metadata("design:paramtypes", [balance_service_1.BalanceService])
], BalanceController);
//# sourceMappingURL=balance.controller.js.map