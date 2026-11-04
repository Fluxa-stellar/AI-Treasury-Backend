import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { TransactionsService } from './transactions.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BlockchainService } from '../blockchain/blockchain.service.js';
import { BnbService } from '../blockchain/bnb.service.js';
import { TransactionTypeDto } from './dto/propose-transaction.dto.js';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: any;
  let blockchainService: any;

  const mockAddress = '0x1234567890123456789012345678901234567890';
  const mockTxHash = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef';

  beforeEach(async () => {
    prisma = {
      treasury: {
        findUnique: jest.fn(),
      },
      approval: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      transaction: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
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
        TransactionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: BlockchainService, useValue: blockchainService },
        BnbService,
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  describe('proposeTransaction', () => {
    it('should create an approval record for a proposed transaction', async () => {
      prisma.treasury.findUnique.mockResolvedValue({
        id: 'treasury-1',
        ownerId: 'user-1',
      });

      prisma.approval.create.mockResolvedValue({
        id: 'approval-1',
        treasuryId: 'treasury-1',
        recipientAddress: mockAddress.toLowerCase(),
        amount: '2.5',
        status: 'PENDING',
      });

      const result = await service.proposeTransaction('user-1', {
        treasuryId: 'treasury-1',
        toAddress: mockAddress,
        amount: '2.5',
        type: TransactionTypeDto.TRANSFER,
      });

      expect(result).toHaveProperty('approval');
      expect(prisma.approval.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            recipientAddress: mockAddress.toLowerCase(),
            status: 'PENDING',
          }),
        }),
      );
    });

    it('should reject non-positive amounts', async () => {
      prisma.treasury.findUnique.mockResolvedValue({
        id: 'treasury-1',
        ownerId: 'user-1',
      });

      await expect(
        service.proposeTransaction('user-1', {
          treasuryId: 'treasury-1',
          toAddress: mockAddress,
          amount: '0',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('recordTransaction', () => {
    it('should return existing record if txHash is duplicate (idempotency)', async () => {
      prisma.treasury.findUnique.mockResolvedValue({
        id: 'treasury-1',
        ownerId: 'user-1',
      });

      prisma.transaction.findUnique.mockResolvedValue({
        id: 'tx-existing',
        txHash: mockTxHash.toLowerCase(),
        status: 'CONFIRMED',
      });

      const result = await service.recordTransaction('user-1', {
        treasuryId: 'treasury-1',
        txHash: mockTxHash,
        fromAddress: mockAddress,
        toAddress: mockAddress,
        amount: '1.0',
      });

      expect(result.id).toBe('tx-existing');
      expect(prisma.transaction.create).not.toHaveBeenCalled();
    });

    it('should record new transaction with confirmed status from receipt', async () => {
      prisma.treasury.findUnique.mockResolvedValue({
        id: 'treasury-1',
        ownerId: 'user-1',
        chainId: 97,
      });

      prisma.transaction.findUnique.mockResolvedValue(null);
      prisma.transaction.create.mockResolvedValue({
        id: 'tx-new',
        txHash: mockTxHash.toLowerCase(),
        status: 'CONFIRMED',
        blockNumber: '123456',
      });

      const result = await service.recordTransaction('user-1', {
        treasuryId: 'treasury-1',
        txHash: mockTxHash,
        fromAddress: mockAddress,
        toAddress: mockAddress,
        amount: '1.0',
      });

      expect(result.status).toBe('CONFIRMED');
      expect(prisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'CONFIRMED',
            blockNumber: '123456',
          }),
        }),
      );
    });
  });
});

