import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { BlockchainService } from '../blockchain/blockchain.service.js';
import { BnbService } from '../blockchain/bnb.service.js';
import { ConnectWalletDto } from './dto/connect-wallet.dto.js';

@Injectable()
export class WalletsService {
  constructor(
    private prisma: PrismaService,
    private blockchainService: BlockchainService,
    private bnbService: BnbService,
  ) {}

  async listUserWallets(userId: string) {
    return this.prisma.wallet.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async connectWallet(userId: string, dto: ConnectWalletDto) {
    const address = this.bnbService.normalizeAddress(dto.address);
    const chainId = dto.chainId || 97;

    const existing = await this.prisma.wallet.findUnique({
      where: { address },
    });

    if (existing) {
      if (existing.userId !== userId) {
        throw new BadRequestException('Wallet address is already linked to another account');
      }
      return existing;
    }

    return this.prisma.wallet.create({
      data: {
        userId,
        address,
        chainId,
        isPrimary: false,
        isActive: true,
      },
    });
  }

  async setPrimaryWallet(userId: string, walletId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet || wallet.userId !== userId) {
      throw new NotFoundException('Wallet not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.wallet.updateMany({
        where: { userId },
        data: { isPrimary: false },
      });

      return tx.wallet.update({
        where: { id: walletId },
        data: { isPrimary: true },
      });
    });
  }

  async getWalletLiveBalance(address: string) {
    const norm = this.bnbService.normalizeAddress(address);
    const bnbBalance = await this.blockchainService.getNativeBnbBalance(norm);

    return {
      address: norm,
      nativeBnb: {
        raw: bnbBalance.raw.toString(),
        formatted: bnbBalance.formatted,
        symbol: 'BNB',
      },
    };
  }
}

