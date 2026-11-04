import { Module } from '@nestjs/common';
import { TreasuryService } from './treasury.service.js';
import { TreasuryController } from './treasury.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { BlockchainModule } from '../blockchain/blockchain.module.js';

@Module({
  imports: [PrismaModule, BlockchainModule],
  controllers: [TreasuryController],
  providers: [TreasuryService],
  exports: [TreasuryService],
})
export class TreasuryModule {}
