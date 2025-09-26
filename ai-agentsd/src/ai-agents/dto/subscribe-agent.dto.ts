import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SubscriptionPlan {
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise'
}

export class SubscribeAgentDto {
  @ApiProperty({ description: 'Agent ID to subscribe to', example: 'uuid-string' })
  @IsString()
  agentId: string;

  @ApiProperty({ enum: SubscriptionPlan, description: 'Subscription plan' })
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @ApiPropertyOptional({ description: 'Monthly usage limit', example: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number;

  @ApiPropertyOptional({ description: 'Auto-renew subscription', default: true })
  @IsOptional()
  autoRenew?: boolean;
}
