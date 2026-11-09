import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { BlockchainService } from '../blockchain/blockchain.service.js';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private prisma: PrismaService,
    private blockchainService: BlockchainService,
  ) {}

  private async verifyTreasuryAccess(treasuryId: string, userId: string) {
    const treasury = await this.prisma.treasury.findUnique({
      where: { id: treasuryId },
    });

    if (!treasury) {
      throw new NotFoundException('Treasury not found');
    }

    if (treasury.ownerId !== userId) {
      throw new ForbiddenException('Access denied to this treasury');
    }

    return treasury;
  }

  async getTreasuryAnalytics(treasuryId: string, userId: string) {
    await this.verifyTreasuryAccess(treasuryId, userId);

    const [transactions, assets] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { treasuryId },
        orderBy: { timestamp: 'asc' },
      }),
      this.prisma.treasuryAsset.findMany({
        where: { treasuryId },
      }),
    ]);

    let totalInflow = 0;
    let totalOutflow = 0;
    const typeCounts: Record<string, number> = {};
    const monthlySpending: Record<string, number> = {};

    for (const tx of transactions) {
      const amt = parseFloat(tx.amount.toString()) || 0;
      typeCounts[tx.type] = (typeCounts[tx.type] || 0) + 1;

      const monthKey = tx.timestamp.toISOString().slice(0, 7); // YYYY-MM

      if (tx.type === 'DEPOSIT') {
        totalInflow += amt;
      } else if (tx.type === 'TRANSFER' || tx.type === 'WITHDRAW') {
        totalOutflow += amt;
        monthlySpending[monthKey] = (monthlySpending[monthKey] || 0) + amt;
      }
    }

    // Asset allocation breakdown
    const assetBreakdown = assets.map((a) => ({
      symbol: a.symbol,
      name: a.name || a.symbol,
      balance: a.balance.toString(),
      tokenAddress: a.tokenAddress,
    }));

    return {
      treasuryId,
      totalInflow: totalInflow.toFixed(4),
      totalOutflow: totalOutflow.toFixed(4),
      netFlow: (totalInflow - totalOutflow).toFixed(4),
      transactionCount: transactions.length,
      typeCounts,
      monthlySpending,
      assetAllocation: assetBreakdown,
    };
  }

  async getSnapshots(treasuryId: string, userId: string) {
    await this.verifyTreasuryAccess(treasuryId, userId);

    return this.prisma.treasurySnapshot.findMany({
      where: { treasuryId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  async captureSnapshot(treasuryId: string, userId: string) {
    const treasury = await this.verifyTreasuryAccess(treasuryId, userId);
    const wallet = await this.prisma.wallet.findUnique({ where: { id: treasury.walletId } });

    let nativeBalance = 0;
    let stableBalance = 0;
    const targetAddress = wallet?.address || treasury.contractAddress;

    if (targetAddress) {
      const native = await this.blockchainService.getNativeBalance(targetAddress);
      nativeBalance = parseFloat(native.formatted) || 0;

      const isAevum = this.blockchainService.isAevum();
      if (isAevum) {
        const tusd8Address = '0x456569838f1d43009A91ebA4263147Afd7233483';
        const tusd8Bal = await this.blockchainService.getTokenBalance(tusd8Address, targetAddress);
        stableBalance = parseFloat(tusd8Bal.balanceFormatted) || 0;
      }
    }

    const nativePrice = this.blockchainService.isAevum() ? 1.25 : 600;
    const totalUsd = nativeBalance * nativePrice + stableBalance;

    const snapshot = await this.prisma.treasurySnapshot.create({
      data: {
        treasuryId,
        totalValueUsd: totalUsd,
        bnbValueUsd: nativeBalance,
        usdtValueUsd: stableBalance,
        usdcValueUsd: 0,
      },
    });

    return snapshot;
  }
}

