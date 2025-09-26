"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorTrackingModule = void 0;
const common_1 = require("@nestjs/common");
const error_tracking_controller_1 = require("./error-tracking.controller");
const error_tracking_service_1 = require("../common/error-tracking.service");
const logger_service_1 = require("../common/logger.service");
const metrics_service_1 = require("../common/metrics.service");
let ErrorTrackingModule = class ErrorTrackingModule {
};
exports.ErrorTrackingModule = ErrorTrackingModule;
exports.ErrorTrackingModule = ErrorTrackingModule = __decorate([
    (0, common_1.Module)({
        controllers: [error_tracking_controller_1.ErrorTrackingController],
        providers: [error_tracking_service_1.ErrorTrackingService, logger_service_1.LoggerService, metrics_service_1.MetricsService],
        exports: [error_tracking_service_1.ErrorTrackingService],
    })
], ErrorTrackingModule);
//# sourceMappingURL=error-tracking.module.js.map