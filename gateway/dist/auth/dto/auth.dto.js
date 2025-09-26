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
exports.UpdateAccountResponseDto = exports.UpdateAccountRequestDto = exports.AccountInfoDto = exports.RevokeTokenResponseDto = exports.RevokeTokenRequestDto = exports.RefreshTokenResponseDto = exports.RefreshTokenRequestDto = exports.ValidateTokenResponseDto = exports.ValidateTokenRequestDto = exports.CreateAccountResponseDto = exports.CreateAccountRequestDto = exports.TokenType = exports.AccountKind = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const base_dto_1 = require("../../common/dto/base.dto");
var AccountKind;
(function (AccountKind) {
    AccountKind["HUMAN"] = "human";
    AccountKind["AGENT"] = "agent";
    AccountKind["TREASURY"] = "treasury";
})(AccountKind || (exports.AccountKind = AccountKind = {}));
var TokenType;
(function (TokenType) {
    TokenType["BEARER"] = "Bearer";
    TokenType["API_KEY"] = "api_key";
})(TokenType || (exports.TokenType = TokenType = {}));
class CreateAccountRequestDto {
}
exports.CreateAccountRequestDto = CreateAccountRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Display name for the account',
        example: 'John Doe',
        minLength: 1,
        maxLength: 100
    }),
    (0, class_validator_1.IsString)({ message: 'Display name must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Display name is required' }),
    (0, class_validator_1.MinLength)(1, { message: 'Display name cannot be empty' }),
    (0, class_validator_1.MaxLength)(100, { message: 'Display name cannot exceed 100 characters' }),
    __metadata("design:type", String)
], CreateAccountRequestDto.prototype, "displayName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account type',
        example: 'human',
        enum: AccountKind
    }),
    (0, class_validator_1.IsEnum)(AccountKind, { message: 'Invalid account kind' }),
    __metadata("design:type", String)
], CreateAccountRequestDto.prototype, "kind", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Optional email address',
        example: 'john.doe@example.com',
        required: false,
        maxLength: 255
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Email must be a string' }),
    (0, class_validator_1.MaxLength)(255, { message: 'Email cannot exceed 255 characters' }),
    (0, class_validator_1.Matches)(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: 'Invalid email format' }),
    __metadata("design:type", String)
], CreateAccountRequestDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Optional description',
        example: 'Personal account for AI services',
        required: false,
        maxLength: 500
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Description must be a string' }),
    (0, class_validator_1.MaxLength)(500, { message: 'Description cannot exceed 500 characters' }),
    __metadata("design:type", String)
], CreateAccountRequestDto.prototype, "description", void 0);
class CreateAccountResponseDto extends base_dto_1.BaseResponseDto {
}
exports.CreateAccountResponseDto = CreateAccountResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Generated API key',
        example: 'ak_123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAccountResponseDto.prototype, "apiKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account ID',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAccountResponseDto.prototype, "accountId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account display name',
        example: 'John Doe'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAccountResponseDto.prototype, "displayName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account type',
        example: 'human',
        enum: AccountKind
    }),
    (0, class_validator_1.IsEnum)(AccountKind),
    __metadata("design:type", String)
], CreateAccountResponseDto.prototype, "kind", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account email',
        example: 'john.doe@example.com'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAccountResponseDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account description',
        example: 'Personal account for AI services'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAccountResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account scopes',
        example: ['spend', 'view']
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateAccountResponseDto.prototype, "scopes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account creation timestamp',
        example: '2024-01-01T00:00:00.000Z'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAccountResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account reputation score',
        example: 50.0,
        minimum: 0,
        maximum: 100
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAccountResponseDto.prototype, "reputationScore", void 0);
class ValidateTokenRequestDto {
}
exports.ValidateTokenRequestDto = ValidateTokenRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'API token to validate',
        example: 'ak_123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, class_validator_1.IsString)({ message: 'Token must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Token is required' }),
    __metadata("design:type", String)
], ValidateTokenRequestDto.prototype, "token", void 0);
class ValidateTokenResponseDto extends base_dto_1.BaseResponseDto {
}
exports.ValidateTokenResponseDto = ValidateTokenResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Token validation result',
        example: true
    }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ValidateTokenResponseDto.prototype, "valid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Token payload information',
        example: {
            account_id: '123e4567-e89b-12d3-a456-426614174000',
            scopes: ['spend', 'view'],
            kind: 'human'
        }
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], ValidateTokenResponseDto.prototype, "payload", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Error message if validation failed',
        example: 'Token expired'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ValidateTokenResponseDto.prototype, "error", void 0);
class RefreshTokenRequestDto {
}
exports.RefreshTokenRequestDto = RefreshTokenRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Refresh token',
        example: 'rt_123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, class_validator_1.IsString)({ message: 'Refresh token must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Refresh token is required' }),
    __metadata("design:type", String)
], RefreshTokenRequestDto.prototype, "refreshToken", void 0);
class RefreshTokenResponseDto extends base_dto_1.BaseResponseDto {
}
exports.RefreshTokenResponseDto = RefreshTokenResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'New access token',
        example: 'ak_123e4567-e89b-12d3-a456-426614174001'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RefreshTokenResponseDto.prototype, "accessToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'New refresh token',
        example: 'rt_123e4567-e89b-12d3-a456-426614174001'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RefreshTokenResponseDto.prototype, "refreshToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Token type',
        example: 'Bearer',
        enum: TokenType
    }),
    (0, class_validator_1.IsEnum)(TokenType),
    __metadata("design:type", String)
], RefreshTokenResponseDto.prototype, "tokenType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Token expiration time in seconds',
        example: 3600
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RefreshTokenResponseDto.prototype, "expiresIn", void 0);
class RevokeTokenRequestDto {
}
exports.RevokeTokenRequestDto = RevokeTokenRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Token to revoke',
        example: 'ak_123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, class_validator_1.IsString)({ message: 'Token must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Token is required' }),
    __metadata("design:type", String)
], RevokeTokenRequestDto.prototype, "token", void 0);
class RevokeTokenResponseDto extends base_dto_1.BaseResponseDto {
}
exports.RevokeTokenResponseDto = RevokeTokenResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Token revocation result',
        example: true
    }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], RevokeTokenResponseDto.prototype, "revoked", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Revocation timestamp',
        example: '2024-01-01T00:00:00.000Z'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RevokeTokenResponseDto.prototype, "revokedAt", void 0);
class AccountInfoDto {
}
exports.AccountInfoDto = AccountInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account ID',
        example: '123e4567-e89b-12d3-a456-426614174000'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AccountInfoDto.prototype, "accountId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account display name',
        example: 'John Doe'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AccountInfoDto.prototype, "displayName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account type',
        example: 'human',
        enum: AccountKind
    }),
    (0, class_validator_1.IsEnum)(AccountKind),
    __metadata("design:type", String)
], AccountInfoDto.prototype, "kind", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account email',
        example: 'john.doe@example.com'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AccountInfoDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account description',
        example: 'Personal account for AI services'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AccountInfoDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account scopes',
        example: ['spend', 'view']
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AccountInfoDto.prototype, "scopes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account creation timestamp',
        example: '2024-01-01T00:00:00.000Z'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AccountInfoDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account last updated timestamp',
        example: '2024-01-01T00:00:00.000Z'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AccountInfoDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account reputation score',
        example: 50.0,
        minimum: 0,
        maximum: 100
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AccountInfoDto.prototype, "reputationScore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Account status',
        example: 'active',
        enum: ['active', 'suspended', 'deleted']
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AccountInfoDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'TPM attestation status',
        example: true
    }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AccountInfoDto.prototype, "tpmAttested", void 0);
class UpdateAccountRequestDto {
}
exports.UpdateAccountRequestDto = UpdateAccountRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'New display name',
        example: 'John Smith',
        required: false,
        minLength: 1,
        maxLength: 100
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Display name must be a string' }),
    (0, class_validator_1.MinLength)(1, { message: 'Display name cannot be empty' }),
    (0, class_validator_1.MaxLength)(100, { message: 'Display name cannot exceed 100 characters' }),
    __metadata("design:type", String)
], UpdateAccountRequestDto.prototype, "displayName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'New email address',
        example: 'john.smith@example.com',
        required: false,
        maxLength: 255
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Email must be a string' }),
    (0, class_validator_1.MaxLength)(255, { message: 'Email cannot exceed 255 characters' }),
    (0, class_validator_1.Matches)(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: 'Invalid email format' }),
    __metadata("design:type", String)
], UpdateAccountRequestDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'New description',
        example: 'Updated account description',
        required: false,
        maxLength: 500
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Description must be a string' }),
    (0, class_validator_1.MaxLength)(500, { message: 'Description cannot exceed 500 characters' }),
    __metadata("design:type", String)
], UpdateAccountRequestDto.prototype, "description", void 0);
class UpdateAccountResponseDto extends base_dto_1.BaseResponseDto {
}
exports.UpdateAccountResponseDto = UpdateAccountResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Updated account information'
    }),
    __metadata("design:type", AccountInfoDto)
], UpdateAccountResponseDto.prototype, "account", void 0);
//# sourceMappingURL=auth.dto.js.map