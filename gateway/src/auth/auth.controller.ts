import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';

export class CreateDevAccountRequest {
  displayName: string;
  kind?: 'human' | 'agent';
}

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('dev')
  async createDevAccount(@Body() request: CreateDevAccountRequest) {
    try {
      return await this.authService.createDevAccount(
        request.displayName,
        request.kind || 'human'
      );
    } catch (error) {
      throw new BadRequestException(`Failed to create dev account: ${error.message}`);
    }
  }
}
