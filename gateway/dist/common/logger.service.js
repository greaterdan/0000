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
exports.LoggerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let LoggerService = class LoggerService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new (require('winston').createLogger)({
            level: this.configService.get('LOG_LEVEL', 'info'),
            format: require('winston').format.combine(require('winston').format.timestamp(), require('winston').format.errors({ stack: true }), require('winston').format.json()),
            defaultMeta: {
                service: 'gateway',
                version: '1.0.0',
                environment: this.configService.get('NODE_ENV', 'development'),
            },
            transports: [
                new (require('winston').transports.Console)({
                    format: require('winston').format.combine(require('winston').format.colorize(), require('winston').format.simple()),
                }),
                ...(this.configService.get('NODE_ENV') === 'production' ? [
                    new (require('winston').transports.File)({
                        filename: 'logs/error.log',
                        level: 'error',
                    }),
                    new (require('winston').transports.File)({
                        filename: 'logs/combined.log',
                    }),
                ] : []),
            ],
        });
    }
    log(message, context) {
        this.logger.log('info', message, context);
    }
    error(message, trace, context) {
        this.logger.error(message, { trace, ...context });
    }
    warn(message, context) {
        this.logger.warn(message, context);
    }
    debug(message, context) {
        this.logger.debug(message, context);
    }
    verbose(message, context) {
        this.logger.verbose(message, context);
    }
    logTransaction(operation, details, context) {
        this.log(`Transaction: ${operation}`, {
            operation,
            ...details,
            ...context,
        });
    }
    logSecurity(event, details, context) {
        this.warn(`Security Event: ${event}`, {
            securityEvent: event,
            ...details,
            ...context,
        });
    }
    logPerformance(operation, duration, context) {
        this.log(`Performance: ${operation}`, {
            operation,
            duration,
            ...context,
        });
    }
    logError(error, context) {
        this.error(`Error: ${error.message || error}`, error.stack, context);
    }
    logDatabase(operation, table, duration, details) {
        this.log(`Database: ${operation} on ${table}`, {
            operation,
            table,
            duration,
            ...details,
        });
    }
    logExternalService(service, operation, duration, status) {
        this.log(`External Service: ${service} - ${operation}`, {
            service,
            operation,
            duration,
            status,
        });
    }
    logBusinessEvent(eventType, details) {
        this.log(`Business Event: ${eventType}`, {
            eventType,
            ...details,
        });
    }
    logHealth(component, details) {
        this.log(`Health Check: ${component}`, {
            component,
            ...details,
        });
    }
};
exports.LoggerService = LoggerService;
exports.LoggerService = LoggerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], LoggerService);
//# sourceMappingURL=logger.service.js.map