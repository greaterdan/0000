import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { OAuthService, TokenRequest } from './oauth.service';

@Controller('oauth')
export class OAuthController {
  constructor(private readonly oauthService: OAuthService) {}

  @Post('token')
  async issueToken(@Body() request: TokenRequest) {
    try {
      return await this.oauthService.issueToken(request);
    } catch (error) {
      throw new BadRequestException(`Failed to issue token: ${error.message}`);
    }
  }
}
