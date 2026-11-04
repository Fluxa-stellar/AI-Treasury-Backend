import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service.js';
import { AnalyticsController } from './analytics.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { BlockchainModule } from '../blockchain/blockchain.module.js';

@Module({
  imports: [PrismaModule, BlockchainModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}

