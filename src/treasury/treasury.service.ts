import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { BlockchainService } from '../blockchain/blockchain.service.js';
import { ContractService } from '../blockchain/contract.service.js';
import { BnbService } from '../blockchain/bnb.service.js';
import { CreateTreasuryDto } from './dto/create-treasury.dto.js';
import { UpdateTreasuryDto } from './dto/update-treasury.dto.js';
import { AddAssetDto } from './dto/add-asset.dto.js';

@Injectable()
export class TreasuryService {
  private readonly logger = new Logger(TreasuryService.name);

  constructor(
    private prisma: PrismaService,
    private blockchainService: BlockchainService,
    private contractService: ContractService,
    private bnbService: BnbService,
  ) {}

  async ensureOwnership(treasuryId: string, userId: string) {
    const treasury = await this.prisma.treasury.findUnique({
      where: { id: treasuryId },
    });

    if (!treasury) {
      throw new NotFoundException('Treasury not found');
    }

    if (treasury.ownerId !== userId) {
      throw new ForbiddenException('You do not have access to this treasury');
    }

    return treasury;
  }

  async createTreasury(userId: string, dto: CreateTreasuryDto) {
    // 1. Find user's wallet
    let walletId = dto.walletId;
    if (!walletId) {
      const primaryWallet = await this.prisma.wallet.findFirst({
        where: { userId, isPrimary: true },
      });
      const anyWallet = primaryWallet || (await this.prisma.wallet.findFirst({ where: { userId } }));
      if (!anyWallet) {
        throw new BadRequestException('Please connect a wallet before creating a treasury');
      }
      walletId = anyWallet.id;
    }

    const contractAddress = dto.contractAddress
      ? this.bnbService.normalizeAddress(dto.contractAddress)
      : this.contractService.getDefaultContractAddress() || null;

    const chainId = dto.chainId || this.blockchainService.getChainId();

    const treasury = await this.prisma.treasury.create({
      data: {
        name: dto.name,
        ownerId: userId,
        walletId,
        contractAddress,
        chainId,
        isActive: true,
      },
      include: {
        wallet: true,
      },
    });

    // Automatically add Native BNB asset
    const bnbBalance = await this.blockchainService.getNativeBnbBalance(treasury.wallet.address);

    await this.prisma.treasuryAsset.create({
      data: {
        treasuryId: treasury.id,
        tokenAddress: '0x0000000000000000000000000000000000000000',
        symbol: 'BNB',
        name: 'BNB Native Token',
        decimals: 18,
        balance: bnbBalance.formatted,
        priceUsd: 0, // Placeholder until oracle/coingecko configured
        valueUsd: 0,
      },
    });

    return this.getTreasuryById(treasury.id, userId);
  }

  async listUserTreasuries(userId: string) {
    return this.prisma.treasury.findMany({
      where: { ownerId: userId },
      include: {
        wallet: true,
        assets: true,
        _count: {
          select: {
            transactions: true,
            approvals: true,
            rules: true,
            insights: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTreasuryById(treasuryId: string, userId: string) {
    await this.ensureOwnership(treasuryId, userId);

    return this.prisma.treasury.findUnique({
      where: { id: treasuryId },
      include: {
        wallet: true,
        assets: true,
        _count: {
          select: {
            transactions: true,
            approvals: true,
            rules: true,
            insights: true,
            recommendations: true,
          },
        },
      },
    });
  }

  async updateTreasury(treasuryId: string, userId: string, dto: UpdateTreasuryDto) {
    await this.ensureOwnership(treasuryId, userId);

    return this.prisma.treasury.update({
      where: { id: treasuryId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.contractAddress !== undefined && {
          contractAddress: dto.contractAddress
            ? this.bnbService.normalizeAddress(dto.contractAddress)
            : null,
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: {
        wallet: true,
        assets: true,
      },
    });
  }

  async getOverview(treasuryId: string, userId: string) {
    const treasury = await this.ensureOwnership(treasuryId, userId);

    // Refresh on-chain native balance (tQDAY on Aevum, BNB on BSC)
    const walletAddress = (
      await this.prisma.wallet.findUnique({ where: { id: treasury.walletId } })
    )?.address;

    let nativeBalanceFormatted = '0';
    if (walletAddress) {
      const native = await this.blockchainService.getNativeBalance(walletAddress);
      nativeBalanceFormatted = native.formatted;
    }

    const isAevum = this.blockchainService.isAevum();
    const nativeSymbol = this.blockchainService.getNativeSymbol();
    const vaultTokenSymbol = isAevum ? 'tUSD8' : 'BNB';

    // Check smart contract balance & spending status if vault is configured
    let vaultSpendingStatus: any = null;
    let vaultBalanceFormatted = '0';
    if (treasury.contractAddress) {
      vaultSpendingStatus = await this.contractService.getSpendingStatus(treasury.contractAddress);
      vaultBalanceFormatted = await this.contractService.getVaultBalance(
        isAevum ? undefined : '0x0000000000000000000000000000000000000000',
        treasury.contractAddress,
      );
    }

    const [assets, recentTxCount, pendingApprovalsCount, activeRulesCount, recentInsights] =
      await Promise.all([
        this.prisma.treasuryAsset.findMany({ where: { treasuryId } }),
        this.prisma.transaction.count({
          where: {
            treasuryId,
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        }),
        this.prisma.approval.count({
          where: { treasuryId, status: 'PENDING' },
        }),
        this.prisma.rule.count({
          where: { treasuryId, isActive: true },
        }),
        this.prisma.agentInsight.findMany({
          where: { treasuryId },
          orderBy: { createdAt: 'desc' },
          take: 3,
        }),
      ]);

    return {
      treasuryId: treasury.id,
      name: treasury.name,
      contractAddress: treasury.contractAddress,
      chainId: treasury.chainId,
      network: this.blockchainService.getNetworkName(),
      walletAddress,
      nativeBalance: nativeBalanceFormatted,
      nativeSymbol,
      vaultBalance: vaultBalanceFormatted,
      vaultTokenSymbol,
      // Backwards-compatible aliases for frontend:
      nativeBnbBalance: nativeBalanceFormatted,
      vaultBnbBalance: vaultBalanceFormatted,
      vaultSpendingStatus,
      totalAssetsCount: assets.length,
      assets,
      recentTxCount,
      pendingApprovalsCount,
      activeRulesCount,
      recentInsights,
    };
  }

  async getAssets(treasuryId: string, userId: string) {
    const treasury = await this.ensureOwnership(treasuryId, userId);
    return this.prisma.treasuryAsset.findMany({
      where: { treasuryId },
      orderBy: { symbol: 'asc' },
    });
  }

  async addAsset(treasuryId: string, userId: string, dto: AddAssetDto) {
    const treasury = await this.ensureOwnership(treasuryId, userId);
    const tokenAddress = this.bnbService.normalizeAddress(dto.tokenAddress);

    // Check if asset already exists in this treasury
    const existing = await this.prisma.treasuryAsset.findUnique({
      where: {
        treasuryId_tokenAddress: {
          treasuryId,
          tokenAddress,
        },
      },
    });

    if (existing) {
      return existing;
    }

    // Query on-chain metadata & balance
    const wallet = await this.prisma.wallet.findUnique({ where: { id: treasury.walletId } });
    if (!wallet) {
      throw new NotFoundException('Linked wallet not found');
    }

    const balanceInfo = await this.blockchainService.getTokenBalance(tokenAddress, wallet.address);

    return this.prisma.treasuryAsset.create({
      data: {
        treasuryId,
        tokenAddress,
        symbol: balanceInfo.symbol,
        name: balanceInfo.name,
        decimals: balanceInfo.decimals,
        balance: balanceInfo.balanceFormatted,
        priceUsd: 0,
        valueUsd: 0,
      },
    });
  }

  async syncTreasuryBalances(treasuryId: string, userId: string) {
    const treasury = await this.ensureOwnership(treasuryId, userId);
    const wallet = await this.prisma.wallet.findUnique({ where: { id: treasury.walletId } });

    if (!wallet) {
      throw new NotFoundException('Linked wallet not found');
    }

    const assets = await this.prisma.treasuryAsset.findMany({
      where: { treasuryId },
    });

    const updatedAssets: any[] = [];
    for (const asset of assets) {
      try {
        const live = await this.blockchainService.getTokenBalance(
          asset.tokenAddress,
          wallet.address,
        );

        const updated = await this.prisma.treasuryAsset.update({
          where: { id: asset.id },
          data: {
            balance: live.balanceFormatted,
          },
        });
        updatedAssets.push(updated);
      } catch (err) {
        this.logger.error(`Failed to refresh asset ${asset.symbol}: ${err.message}`);
        updatedAssets.push(asset);
      }
    }

    return {
      syncedAt: new Date().toISOString(),
      assets: updatedAssets,
    };
  }
}
