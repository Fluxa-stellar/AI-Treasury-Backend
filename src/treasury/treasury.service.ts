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

    // Automatically add Native asset (tQDAY on Aevum, BNB on BSC)
    const isAevum = this.blockchainService.isAevum();
    const nativeSymbol = this.blockchainService.getNativeSymbol();
    const nativeName = isAevum ? 'Aevum Native Gas Token' : 'BNB Native Token';
    const nativeBalance = await this.blockchainService.getNativeBalance(treasury.wallet.address);

    await this.prisma.treasuryAsset.create({
      data: {
        treasuryId: treasury.id,
        tokenAddress: '0x0000000000000000000000000000000000000000',
        symbol: nativeSymbol,
        name: nativeName,
        decimals: 18,
        balance: nativeBalance.formatted,
        priceUsd: isAevum ? 1.25 : 600,
        valueUsd: parseFloat(nativeBalance.formatted || '0') * (isAevum ? 1.25 : 600),
      },
    });

    if (isAevum) {
      const tusd8Address = '0x456569838f1d43009A91ebA4263147Afd7233483'.toLowerCase();
      const tusd8Bal = await this.blockchainService.getTokenBalance(tusd8Address, treasury.wallet.address);
      await this.prisma.treasuryAsset.create({
        data: {
          treasuryId: treasury.id,
          tokenAddress: tusd8Address,
          symbol: 'tUSD8',
          name: 'tUSD8 Stablecoin',
          decimals: 6,
          balance: tusd8Bal.balanceFormatted,
          priceUsd: 1.0,
          valueUsd: parseFloat(tusd8Bal.balanceFormatted || '0') * 1.0,
        },
      }).catch(() => null);
    }

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
    const isAevum = this.blockchainService.isAevum();

    const assets = await this.prisma.treasuryAsset.findMany({
      where: { treasuryId },
      orderBy: { symbol: 'asc' },
    });

    if (isAevum) {
      // 1. Normalize any legacy BNB or zero-address asset to tQDAY
      for (const asset of assets) {
        if (asset.symbol === 'BNB' || asset.tokenAddress === '0x0000000000000000000000000000000000000000') {
          asset.symbol = 'tQDAY';
          asset.name = 'Aevum Native Gas Token';
          await this.prisma.treasuryAsset.update({
            where: { id: asset.id },
            data: { symbol: 'tQDAY', name: 'Aevum Native Gas Token' },
          }).catch(() => null);
        }
      }

      // 2. Ensure primary settlement token tUSD8 is registered for this treasury
      const tusd8Address = '0x456569838f1d43009A91ebA4263147Afd7233483'.toLowerCase();
      const hasTusd8 = assets.some(
        (a) => a.tokenAddress.toLowerCase() === tusd8Address || a.symbol === 'tUSD8',
      );

      if (!hasTusd8 && treasury.walletId) {
        const wallet = await this.prisma.wallet.findUnique({ where: { id: treasury.walletId } });
        if (wallet) {
          const balanceInfo = await this.blockchainService.getTokenBalance(tusd8Address, wallet.address);
          const newAsset = await this.prisma.treasuryAsset.create({
            data: {
              treasuryId,
              tokenAddress: tusd8Address,
              symbol: 'tUSD8',
              name: 'tUSD8 Stablecoin',
              decimals: 6,
              balance: balanceInfo.balanceFormatted,
              priceUsd: 1.0,
              valueUsd: parseFloat(balanceInfo.balanceFormatted || '0') * 1.0,
            },
          }).catch(() => null);

          if (newAsset) {
            assets.unshift(newAsset);
          }
        }
      }
    }

    return assets;
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

    const isAevum = this.blockchainService.isAevum();
    const updatedAssets: any[] = [];
    for (const asset of assets) {
      try {
        if (asset.tokenAddress === '0x0000000000000000000000000000000000000000') {
          const native = await this.blockchainService.getNativeBalance(wallet.address);
          const updated = await this.prisma.treasuryAsset.update({
            where: { id: asset.id },
            data: {
              symbol: this.blockchainService.getNativeSymbol(),
              name: isAevum ? 'Aevum Native Gas Token' : 'BNB Native Token',
              balance: native.formatted,
              priceUsd: isAevum ? 1.25 : 600,
              valueUsd: parseFloat(native.formatted || '0') * (isAevum ? 1.25 : 600),
            },
          });
          updatedAssets.push(updated);
          continue;
        }

        const live = await this.blockchainService.getTokenBalance(
          asset.tokenAddress,
          wallet.address,
        );

        const isUsd8 = asset.symbol === 'tUSD8';
        const price = isUsd8 ? 1.0 : Number(asset.priceUsd) || 1.0;
        const updated = await this.prisma.treasuryAsset.update({
          where: { id: asset.id },
          data: {
            balance: live.balanceFormatted,
            valueUsd: parseFloat(live.balanceFormatted || '0') * price,
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
