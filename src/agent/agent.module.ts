import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentService } from './agent.service.js';
import { AgentController } from './agent.controller.js';
import { AgentAiService } from './agent-ai.service.js';
import { AgentAnalysisService } from './agent-analysis.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { TreasuryModule } from '../treasury/treasury.module.js';

@Module({
  imports: [ConfigModule, PrismaModule, TreasuryModule],
  controllers: [AgentController],
  providers: [AgentService, AgentAiService, AgentAnalysisService],
  exports: [AgentService, AgentAiService, AgentAnalysisService],
})
export class AgentModule {}

