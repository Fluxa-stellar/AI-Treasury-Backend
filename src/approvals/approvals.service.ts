import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { BlockchainService } from '../blockchain/blockchain.service.js';

@Injectable()
export class ApprovalsService {
  private readonly logger = new Logger(ApprovalsService.name);

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
      throw new ForbiddenException('You do not own this treasury');
    }

    return treasury;
  }

  async listApprovals(treasuryId: string, userId: string) {
    await this.verifyTreasuryAccess(treasuryId, userId);

    // Auto-expire old pending approvals
    await this.prisma.approval.updateMany({
      where: {
        treasuryId,
        status: 'PENDING',
        expiresAt: { lt: new Date() },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    return this.prisma.approval.findMany({
      where: { treasuryId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getApprovalById(treasuryId: string, approvalId: string, userId: string) {
    await this.verifyTreasuryAccess(treasuryId, userId);

    const approval = await this.prisma.approval.findUnique({
      where: { id: approvalId },
    });

    if (!approval || approval.treasuryId !== treasuryId) {
      throw new NotFoundException('Approval request not found');
    }

    // Check expiration
    if (approval.status === 'PENDING' && approval.expiresAt && approval.expiresAt < new Date()) {
      return this.prisma.approval.update({
        where: { id: approvalId },
        data: { status: 'EXPIRED' },
      });
    }

    return approval;
  }

  async approve(treasuryId: string, approvalId: string, userId: string) {
    await this.verifyTreasuryAccess(treasuryId, userId);

    const approval = await this.prisma.approval.findUnique({
      where: { id: approvalId },
    });

    if (!approval || approval.treasuryId !== treasuryId) {
      throw new NotFoundException('Approval request not found');
    }

    if (approval.status !== 'PENDING') {
      throw new BadRequestException(`Cannot approve request in ${approval.status} status`);
    }

    if (approval.expiresAt && approval.expiresAt < new Date()) {
      await this.prisma.approval.update({
        where: { id: approvalId },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('This approval request has expired');
    }

    return this.prisma.approval.update({
      where: { id: approvalId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
      },
    });
  }

  async reject(treasuryId: string, approvalId: string, userId: string, reason?: string) {
    await this.verifyTreasuryAccess(treasuryId, userId);

    const approval = await this.prisma.approval.findUnique({
      where: { id: approvalId },
    });

    if (!approval || approval.treasuryId !== treasuryId) {
      throw new NotFoundException('Approval request not found');
    }

    if (approval.status !== 'PENDING' && approval.status !== 'APPROVED') {
      throw new BadRequestException(`Cannot reject request in ${approval.status} status`);
    }

    return this.prisma.approval.update({
      where: { id: approvalId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        ...(reason && { reason }),
      },
    });
  }

  async recordExecution(
    treasuryId: string,
    approvalId: string,
    userId: string,
    txHash: string,
  ) {
    const treasury = await this.verifyTreasuryAccess(treasuryId, userId);

    const approval = await this.prisma.approval.findUnique({
      where: { id: approvalId },
    });

    if (!approval || approval.treasuryId !== treasuryId) {
      throw new NotFoundException('Approval request not found');
    }

    if (approval.status !== 'APPROVED' && approval.status !== 'PENDING') {
      throw new BadRequestException(`Cannot execute an approval in ${approval.status} status`);
    }

    const hash = txHash.toLowerCase();

    // Verify blockchain receipt via viem
    let executionStatus: 'EXECUTED' | 'FAILED' | 'APPROVED' = 'APPROVED';
    const receipt = await this.blockchainService.getTransactionReceipt(hash);

    if (receipt) {
      executionStatus = receipt.status === 'success' ? 'EXECUTED' : 'FAILED';
    }

    const updatedApproval = await this.prisma.$transaction(async (prismaTx) => {
      const app = await prismaTx.approval.update({
        where: { id: approvalId },
        data: {
          status: executionStatus,
          txHash: hash,
        },
      });

      // Also ensure transaction record is stored
      const existingTx = await prismaTx.transaction.findUnique({
        where: { txHash: hash },
      });

      if (!existingTx) {
        const wallet = await prismaTx.wallet.findUnique({ where: { id: treasury.walletId } });
        await prismaTx.transaction.create({
          data: {
            treasuryId,
            txHash: hash,
            chainId: treasury.chainId,
            type: (approval.actionType as any) || 'TRANSFER',
            tokenAddress: approval.tokenAddress || '0x0000000000000000000000000000000000000000',
            tokenSymbol: approval.tokenSymbol || 'BNB',
            amount: approval.amount || 0,
            fromAddress: wallet ? wallet.address : '0x0000000000000000000000000000000000000000',
            toAddress: approval.recipientAddress || '0x0000000000000000000000000000000000000000',
            status: receipt ? (receipt.status === 'success' ? 'CONFIRMED' : 'FAILED') : 'PENDING',
            blockNumber: receipt?.blockNumber?.toString() || null,
            timestamp: new Date(),
          },
        });
      }

      return app;
    });

    return updatedApproval;
  }
}

