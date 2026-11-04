import { Module } from '@nestjs/common';
import { WalletsService } from './wallets.service.js';
import { WalletsController } from './wallets.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { BlockchainModule } from '../blockchain/blockchain.module.js';

@Module({
  imports: [PrismaModule, BlockchainModule],
  controllers: [WalletsController],
  providers: [WalletsService],
  exports: [WalletsService],
})
export class WalletsModule {}
