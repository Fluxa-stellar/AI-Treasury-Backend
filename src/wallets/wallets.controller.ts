import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { WalletsService } from './wallets.service.js';
import { ConnectWalletDto } from './dto/connect-wallet.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Wallets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get()
  @ApiOperation({ summary: 'List all connected wallets for current user' })
  @ApiResponse({ status: 200, description: 'Wallets list' })
  async listWallets(@CurrentUser('userId') userId: string) {
    const data = await this.walletsService.listUserWallets(userId);
    return {
      message: 'Wallets retrieved successfully',
      data,
    };
  }

  @Post('connect')
  @ApiOperation({ summary: 'Link an additional wallet to the account' })
  @ApiResponse({ status: 201, description: 'Wallet connected' })
  async connect(
    @CurrentUser('userId') userId: string,
    @Body() dto: ConnectWalletDto,
  ) {
    const data = await this.walletsService.connectWallet(userId, dto);
    return {
      message: 'Wallet linked successfully',
      data,
    };
  }

  @Post(':id/primary')
  @ApiOperation({ summary: 'Set wallet as primary' })
  @ApiResponse({ status: 200, description: 'Primary wallet updated' })
  async setPrimary(
    @CurrentUser('userId') userId: string,
    @Param('id') walletId: string,
  ) {
    const data = await this.walletsService.setPrimaryWallet(userId, walletId);
    return {
      message: 'Primary wallet updated successfully',
      data,
    };
  }

  @Get(':address/balance')
  @ApiOperation({ summary: 'Get live BNB balance for any wallet address' })
  @ApiResponse({ status: 200, description: 'Wallet balance' })
  async getBalance(@Param('address') address: string) {
    const data = await this.walletsService.getWalletLiveBalance(address);
    return {
      message: 'Wallet balance retrieved successfully',
      data,
    };
  }
}

