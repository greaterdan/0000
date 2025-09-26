import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, IsBoolean, MinLength, MaxLength, Matches } from 'class-validator';
import { BaseResponseDto } from '../../common/dto/base.dto';

export enum AccountKind {
  HUMAN = 'human',
  AGENT = 'agent',
  TREASURY = 'treasury'
}

export enum TokenType {
  BEARER = 'Bearer',
  API_KEY = 'api_key'
}

export class CreateAccountRequestDto {
  @ApiProperty({
    description: 'Display name for the account',
    example: 'John Doe',
    minLength: 1,
    maxLength: 100
  })
  @IsString({ message: 'Display name must be a string' })
  @IsNotEmpty({ message: 'Display name is required' })
  @MinLength(1, { message: 'Display name cannot be empty' })
  @MaxLength(100, { message: 'Display name cannot exceed 100 characters' })
  displayName: string;

  @ApiProperty({
    description: 'Account type',
    example: 'human',
    enum: AccountKind
  })
  @IsEnum(AccountKind, { message: 'Invalid account kind' })
  kind: AccountKind;

  @ApiProperty({
    description: 'Optional email address',
    example: 'john.doe@example.com',
    required: false,
    maxLength: 255
  })
  @IsOptional()
  @IsString({ message: 'Email must be a string' })
  @MaxLength(255, { message: 'Email cannot exceed 255 characters' })
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: 'Invalid email format' })
  email?: string;

  @ApiProperty({
    description: 'Optional description',
    example: 'Personal account for AI services',
    required: false,
    maxLength: 500
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  description?: string;
}

export class CreateAccountResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'Generated API key',
    example: 'ak_123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  apiKey: string;

  @ApiProperty({
    description: 'Account ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  accountId: string;

  @ApiProperty({
    description: 'Account display name',
    example: 'John Doe'
  })
  @IsString()
  displayName: string;

  @ApiProperty({
    description: 'Account type',
    example: 'human',
    enum: AccountKind
  })
  @IsEnum(AccountKind)
  kind: AccountKind;

  @ApiProperty({
    description: 'Account email',
    example: 'john.doe@example.com'
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({
    description: 'Account description',
    example: 'Personal account for AI services'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Account scopes',
    example: ['spend', 'view']
  })
  @IsArray()
  @IsString({ each: true })
  scopes: string[];

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsString()
  createdAt: string;

  @ApiProperty({
    description: 'Account reputation score',
    example: 50.0,
    minimum: 0,
    maximum: 100
  })
  @IsString()
  reputationScore: string;
}

export class ValidateTokenRequestDto {
  @ApiProperty({
    description: 'API token to validate',
    example: 'ak_123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString({ message: 'Token must be a string' })
  @IsNotEmpty({ message: 'Token is required' })
  token: string;
}

export class ValidateTokenResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'Token validation result',
    example: true
  })
  @IsBoolean()
  valid: boolean;

  @ApiProperty({
    description: 'Token payload information',
    example: {
      account_id: '123e4567-e89b-12d3-a456-426614174000',
      scopes: ['spend', 'view'],
      kind: 'human'
    }
  })
  @IsOptional()
  payload?: {
    account_id: string;
    scopes: string[];
    kind: string;
    iat: number;
    exp: number;
  };

  @ApiProperty({
    description: 'Error message if validation failed',
    example: 'Token expired'
  })
  @IsOptional()
  @IsString()
  error?: string;
}

export class RefreshTokenRequestDto {
  @ApiProperty({
    description: 'Refresh token',
    example: 'rt_123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString({ message: 'Refresh token must be a string' })
  @IsNotEmpty({ message: 'Refresh token is required' })
  refreshToken: string;
}

export class RefreshTokenResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'New access token',
    example: 'ak_123e4567-e89b-12d3-a456-426614174001'
  })
  @IsString()
  accessToken: string;

  @ApiProperty({
    description: 'New refresh token',
    example: 'rt_123e4567-e89b-12d3-a456-426614174001'
  })
  @IsString()
  refreshToken: string;

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer',
    enum: TokenType
  })
  @IsEnum(TokenType)
  tokenType: TokenType;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 3600
  })
  @IsString()
  expiresIn: string;
}

export class RevokeTokenRequestDto {
  @ApiProperty({
    description: 'Token to revoke',
    example: 'ak_123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString({ message: 'Token must be a string' })
  @IsNotEmpty({ message: 'Token is required' })
  token: string;
}

export class RevokeTokenResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'Token revocation result',
    example: true
  })
  @IsBoolean()
  revoked: boolean;

  @ApiProperty({
    description: 'Revocation timestamp',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsString()
  revokedAt: string;
}

export class AccountInfoDto {
  @ApiProperty({
    description: 'Account ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  accountId: string;

  @ApiProperty({
    description: 'Account display name',
    example: 'John Doe'
  })
  @IsString()
  displayName: string;

  @ApiProperty({
    description: 'Account type',
    example: 'human',
    enum: AccountKind
  })
  @IsEnum(AccountKind)
  kind: AccountKind;

  @ApiProperty({
    description: 'Account email',
    example: 'john.doe@example.com'
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({
    description: 'Account description',
    example: 'Personal account for AI services'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Account scopes',
    example: ['spend', 'view']
  })
  @IsArray()
  @IsString({ each: true })
  scopes: string[];

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsString()
  createdAt: string;

  @ApiProperty({
    description: 'Account last updated timestamp',
    example: '2024-01-01T00:00:00.000Z'
  })
  @IsString()
  updatedAt: string;

  @ApiProperty({
    description: 'Account reputation score',
    example: 50.0,
    minimum: 0,
    maximum: 100
  })
  @IsString()
  reputationScore: string;

  @ApiProperty({
    description: 'Account status',
    example: 'active',
    enum: ['active', 'suspended', 'deleted']
  })
  @IsString()
  status: string;

  @ApiProperty({
    description: 'TPM attestation status',
    example: true
  })
  @IsBoolean()
  tpmAttested: boolean;
}

export class UpdateAccountRequestDto {
  @ApiProperty({
    description: 'New display name',
    example: 'John Smith',
    required: false,
    minLength: 1,
    maxLength: 100
  })
  @IsOptional()
  @IsString({ message: 'Display name must be a string' })
  @MinLength(1, { message: 'Display name cannot be empty' })
  @MaxLength(100, { message: 'Display name cannot exceed 100 characters' })
  displayName?: string;

  @ApiProperty({
    description: 'New email address',
    example: 'john.smith@example.com',
    required: false,
    maxLength: 255
  })
  @IsOptional()
  @IsString({ message: 'Email must be a string' })
  @MaxLength(255, { message: 'Email cannot exceed 255 characters' })
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: 'Invalid email format' })
  email?: string;

  @ApiProperty({
    description: 'New description',
    example: 'Updated account description',
    required: false,
    maxLength: 500
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  description?: string;
}

export class UpdateAccountResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'Updated account information'
  })
  account: AccountInfoDto;
}
