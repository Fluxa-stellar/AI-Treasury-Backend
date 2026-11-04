import { Module } from '@nestjs/common';
import { ApprovalsService } from './approvals.service.js';
import { ApprovalsController } from './approvals.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { BlockchainModule } from '../blockchain/blockchain.module.js';

@Module({
  imports: [PrismaModule, BlockchainModule],
  controllers: [ApprovalsController],
  providers: [ApprovalsService],
  exports: [ApprovalsService],
})
export class ApprovalsModule {}

