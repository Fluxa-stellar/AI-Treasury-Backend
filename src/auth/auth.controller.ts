import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { GetNonceDto } from './dto/get-nonce.dto.js';
import { VerifySignatureDto } from './dto/verify-signature.dto.js';
import { Public } from '../common/decorators/public.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';

@ApiTags('Authentication')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('nonce')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate cryptographic nonce for wallet sign-in' })
  @ApiResponse({ status: 200, description: 'Nonce generated successfully' })
  async getNonce(@Body() dto: GetNonceDto) {
    const data = await this.authService.generateNonce(dto.address);
    return {
      message: 'Nonce generated successfully',
      data,
    };
  }

  @Public()
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify signature and issue JWT session' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 401, description: 'Signature or nonce invalid' })
  async verify(@Body() dto: VerifySignatureDto) {
    const data = await this.authService.verifySignature(
      dto.address,
      dto.signature,
      dto.message,
    );
    return {
      message: 'Authentication successful',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get currently authenticated user profile and wallets' })
  @ApiResponse({ status: 200, description: 'Profile retrieved' })
  async getMe(@CurrentUser('userId') userId: string) {
    const data = await this.authService.getMe(userId);
    return {
      message: 'Profile retrieved successfully',
      data,
    };
  }
}

