import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { BlockchainModule } from '../blockchain/blockchain.module.js';

@Module({
  imports: [PrismaModule, BlockchainModule],
  controllers: [HealthController],
})
export class HealthModule {}

