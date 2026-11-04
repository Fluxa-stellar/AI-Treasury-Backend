import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service.js';
import { BlockchainService } from '../blockchain/blockchain.service.js';
import { Public } from '../common/decorators/public.decorator.js';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private blockchainService: BlockchainService,
  ) {}

  @Public()
  @Get(['health', 'api/health'])
  @ApiOperation({ summary: 'System health check, Neon DB and BNB Chain status' })
  @ApiResponse({ status: 200, description: 'Health status' })
  async checkHealth() {
    let dbStatus = 'disconnected';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch (e) {
      dbStatus = `error: ${e.message}`;
    }

    let bnbStatus = 'disconnected';
    let blockNumber: string | null = null;
    try {
      const block = await this.blockchainService.getBlockNumber();
      bnbStatus = 'connected';
      blockNumber = block.toString();
    } catch (e) {
      bnbStatus = `error: ${e.message}`;
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: {
          provider: 'Neon PostgreSQL',
          status: dbStatus,
        },
        blockchain: {
          chain: 'BNB Smart Chain Testnet',
          chainId: this.blockchainService.getChainId(),
          status: bnbStatus,
          latestBlock: blockNumber,
        },
      },
    };
  }
}
