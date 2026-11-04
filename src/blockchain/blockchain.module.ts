import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BlockchainService } from './blockchain.service.js';
import { ContractService } from './contract.service.js';
import { BnbService } from './bnb.service.js';

@Module({
  imports: [ConfigModule],
  providers: [BlockchainService, ContractService, BnbService],
  exports: [BlockchainService, ContractService, BnbService],
})
export class BlockchainModule {}

