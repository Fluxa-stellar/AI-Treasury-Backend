import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ApprovalsService } from './approvals.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BlockchainService } from '../blockchain/blockchain.service.js';

describe('ApprovalsService', () => {
  let service: ApprovalsService;
  let prisma: any;
  let blockchainService: any;

  beforeEach(async () => {
    prisma = {
      treasury: {
        findUnique: jest.fn(),
      },
      approval: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      transaction: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      wallet: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    blockchainService = {
      getTransactionReceipt: jest.fn().mockResolvedValue({
        status: 'success',
        blockNumber: 123456n,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalsService,
        { provide: PrismaService, useValue: prisma },
        { provide: BlockchainService, useValue: blockchainService },
      ],
    }).compile();

    service = module.get<ApprovalsService>(ApprovalsService);
  });

  describe('approve', () => {
    it('should transition status from PENDING to APPROVED', async () => {
      prisma.treasury.findUnique.mockResolvedValue({
        id: 'treasury-1',
        ownerId: 'user-1',
      });

      prisma.approval.findUnique.mockResolvedValue({
        id: 'approval-1',
        treasuryId: 'treasury-1',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 100000),
      });

      prisma.approval.update.mockResolvedValue({
        id: 'approval-1',
        status: 'APPROVED',
      });

      const result = await service.approve('treasury-1', 'approval-1', 'user-1');
      expect(result.status).toBe('APPROVED');
      expect(prisma.approval.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'approval-1' },
          data: expect.objectContaining({ status: 'APPROVED' }),
        }),
      );
    });

    it('should reject approval if user is not treasury owner', async () => {
      prisma.treasury.findUnique.mockResolvedValue({
        id: 'treasury-1',
        ownerId: 'other-user',
      });

      await expect(service.approve('treasury-1', 'approval-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should expire and reject approval if expired', async () => {
      prisma.treasury.findUnique.mockResolvedValue({
        id: 'treasury-1',
        ownerId: 'user-1',
      });

      prisma.approval.findUnique.mockResolvedValue({
        id: 'approval-1',
        treasuryId: 'treasury-1',
        status: 'PENDING',
        expiresAt: new Date(Date.now() - 5000), // expired in past
      });

      await expect(service.approve('treasury-1', 'approval-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('recordExecution', () => {
    it('should transition approval to EXECUTED upon confirmed receipt', async () => {
      prisma.treasury.findUnique.mockResolvedValue({
        id: 'treasury-1',
        ownerId: 'user-1',
        walletId: 'wallet-1',
        chainId: 97,
      });

      prisma.approval.findUnique.mockResolvedValue({
        id: 'approval-1',
        treasuryId: 'treasury-1',
        status: 'APPROVED',
      });

      prisma.approval.update.mockResolvedValue({
        id: 'approval-1',
        status: 'EXECUTED',
        txHash: '0xhash',
      });

      prisma.transaction.findUnique.mockResolvedValue(null);

      const result = await service.recordExecution('treasury-1', 'approval-1', 'user-1', '0xhash');
      expect(result.status).toBe('EXECUTED');
    });
  });
});

