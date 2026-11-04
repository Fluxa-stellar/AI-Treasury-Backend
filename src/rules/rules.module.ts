import { Module } from '@nestjs/common';
import { RulesService } from './rules.service.js';
import { RulesController } from './rules.controller.js';
import { RulesEngine } from './rules.engine.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [RulesController],
  providers: [RulesService, RulesEngine],
  exports: [RulesService, RulesEngine],
})
export class RulesModule {}

