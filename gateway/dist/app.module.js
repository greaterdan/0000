"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const jobs_module_1 = require("./jobs/jobs.module");
const auth_module_1 = require("./auth/auth.module");
const transfer_module_1 = require("./transfer/transfer.module");
const balance_module_1 = require("./balance/balance.module");
const rates_module_1 = require("./rates/rates.module");
const log_module_1 = require("./log/log.module");
const health_module_1 = require("./health/health.module");
const metrics_module_1 = require("./metrics/metrics.module");
const error_tracking_module_1 = require("./error-tracking/error-tracking.module");
const monitoring_module_1 = require("./monitoring/monitoring.module");
const logger_service_1 = require("./common/logger.service");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            axios_1.HttpModule,
            auth_module_1.AuthModule,
            jobs_module_1.JobsModule,
            transfer_module_1.TransferModule,
            balance_module_1.BalanceModule,
            rates_module_1.RatesModule,
            log_module_1.LogModule,
            health_module_1.HealthModule,
            metrics_module_1.MetricsModule,
            error_tracking_module_1.ErrorTrackingModule,
            monitoring_module_1.MonitoringModule,
        ],
        providers: [logger_service_1.LoggerService],
        exports: [logger_service_1.LoggerService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map