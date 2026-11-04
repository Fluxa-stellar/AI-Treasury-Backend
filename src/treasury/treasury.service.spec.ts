import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TreasuryService } from './treasury.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BlockchainService } from '../blockchain/blockchain.service.js';
import { ContractService } from '../blockchain/contract.service.js';
import { BnbService } from '../blockchain/bnb.service.js';

describe('TreasuryService', () => {
  let service: TreasuryService;
  let prisma: any;
  let blockchainService: any;
  let contractService: any;

  beforeEach(async () => {
    prisma = {
      treasury: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      wallet: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      treasuryAsset: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      transaction: {
        count: jest.fn().mockResolvedValue(5),
      },
      approval: {
        count: jest.fn().mockResolvedValue(1),
      },
      rule: {
        count: jest.fn().mockResolvedValue(2),
      },
      agentInsight: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    blockchainService = {
      getChainId: jest.fn().mockReturnValue(97),
      getNativeBnbBalance: jest.fn().mockResolvedValue({ raw: 1000000000000000000n, formatted: '1.0' }),
    };

    contractService = {
      getDefaultContractAddress: jest.fn().mockReturnValue('0x1111111111111111111111111111111111111111'),
      getSpendingStatus: jest.fn().mockResolvedValue(null),
      getVaultBalance: jest.fn().mockResolvedValue('0'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TreasuryService,
        { provide: PrismaService, useValue: prisma },
        { provide: BlockchainService, useValue: blockchainService },
        { provide: ContractService, useValue: contractService },
        BnbService,
      ],
    }).compile();

    service = module.get<TreasuryService>(TreasuryService);
  });

  describe('ensureOwnership', () => {
    it('should allow access if user is owner', async () => {
      prisma.treasury.findUnique.mockResolvedValue({
        id: 'treasury-1',
        ownerId: 'user-1',
      });

      const result = await service.ensureOwnership('treasury-1', 'user-1');
      expect(result.id).toBe('treasury-1');
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      prisma.treasury.findUnique.mockResolvedValue({
        id: 'treasury-1',
        ownerId: 'different-user',
      });

      await expect(service.ensureOwnership('treasury-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if treasury does not exist', async () => {
      prisma.treasury.findUnique.mockResolvedValue(null);

      await expect(service.ensureOwnership('non-existent', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createTreasury', () => {
    it('should create treasury and initialize native BNB asset', async () => {
      prisma.wallet.findFirst.mockResolvedValue({
        id: 'wallet-1',
        address: '0x1234567890123456789012345678901234567890',
      });

      prisma.treasury.create.mockResolvedValue({
        id: 'treasury-new',
        name: 'My New Treasury',
        ownerId: 'user-1',
        walletId: 'wallet-1',
        contractAddress: '0x1111111111111111111111111111111111111111',
        chainId: 97,
        wallet: { address: '0x1234567890123456789012345678901234567890' },
      });

      prisma.treasury.findUnique.mockResolvedValue({
        id: 'treasury-new',
        name: 'My New Treasury',
        ownerId: 'user-1',
        assets: [],
      });

      const result = await service.createTreasury('user-1', {
        name: 'My New Treasury',
      });

      expect(prisma.treasury.create).toHaveBeenCalled();
      expect(prisma.treasuryAsset.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            symbol: 'BNB',
            balance: '1.0',
          }),
        }),
      );
      expect(result).toBeDefined();
    });
  });
});

