import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RulesEngine } from './rules.engine.js';
import { CreateRuleDto } from './dto/create-rule.dto.js';
import { UpdateRuleDto } from './dto/update-rule.dto.js';

@Injectable()
export class RulesService {
  private readonly logger = new Logger(RulesService.name);

  constructor(
    private prisma: PrismaService,
    private rulesEngine: RulesEngine,
  ) {}

  private async verifyTreasuryAccess(treasuryId: string, userId: string) {
    const treasury = await this.prisma.treasury.findUnique({
      where: { id: treasuryId },
    });

    if (!treasury) {
      throw new NotFoundException('Treasury not found');
    }

    if (treasury.ownerId !== userId) {
      throw new ForbiddenException('You do not own this treasury');
    }

    return treasury;
  }

  async createRule(treasuryId: string, userId: string, dto: CreateRuleDto) {
    await this.verifyTreasuryAccess(treasuryId, userId);

    return this.prisma.rule.create({
      data: {
        treasuryId,
        name: dto.name,
        description: dto.description,
        type: dto.type as any,
        condition: dto.condition,
        action: dto.action,
        executionMode: (dto.executionMode as any) || 'REQUIRE_APPROVAL',
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });
  }

  async listRules(treasuryId: string, userId: string) {
    await this.verifyTreasuryAccess(treasuryId, userId);

    return this.prisma.rule.findMany({
      where: { treasuryId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRuleById(treasuryId: string, ruleId: string, userId: string) {
    await this.verifyTreasuryAccess(treasuryId, userId);

    const rule = await this.prisma.rule.findUnique({
      where: { id: ruleId },
    });

    if (!rule || rule.treasuryId !== treasuryId) {
      throw new NotFoundException('Rule not found');
    }

    return rule;
  }

  async updateRule(
    treasuryId: string,
    ruleId: string,
    userId: string,
    dto: UpdateRuleDto,
  ) {
    await this.verifyTreasuryAccess(treasuryId, userId);

    const rule = await this.prisma.rule.findUnique({
      where: { id: ruleId },
    });

    if (!rule || rule.treasuryId !== treasuryId) {
      throw new NotFoundException('Rule not found');
    }

    return this.prisma.rule.update({
      where: { id: ruleId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.type !== undefined && { type: dto.type as any }),
        ...(dto.condition !== undefined && { condition: dto.condition }),
        ...(dto.action !== undefined && { action: dto.action }),
        ...(dto.executionMode !== undefined && { executionMode: dto.executionMode as any }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deleteRule(treasuryId: string, ruleId: string, userId: string) {
    await this.verifyTreasuryAccess(treasuryId, userId);

    const rule = await this.prisma.rule.findUnique({
      where: { id: ruleId },
    });

    if (!rule || rule.treasuryId !== treasuryId) {
      throw new NotFoundException('Rule not found');
    }

    await this.prisma.rule.delete({
      where: { id: ruleId },
    });

    return { message: 'Rule deleted successfully' };
  }

  async toggleRule(treasuryId: string, ruleId: string, userId: string) {
    await this.verifyTreasuryAccess(treasuryId, userId);

    const rule = await this.prisma.rule.findUnique({
      where: { id: ruleId },
    });

    if (!rule || rule.treasuryId !== treasuryId) {
      throw new NotFoundException('Rule not found');
    }

    return this.prisma.rule.update({
      where: { id: ruleId },
      data: { isActive: !rule.isActive },
    });
  }

  async evaluateRules(treasuryId: string, userId: string) {
    await this.verifyTreasuryAccess(treasuryId, userId);

    const [rules, assets, recentTransactions] = await Promise.all([
      this.prisma.rule.findMany({
        where: { treasuryId, isActive: true },
      }),
      this.prisma.treasuryAsset.findMany({
        where: { treasuryId },
      }),
      this.prisma.transaction.findMany({
        where: { treasuryId },
        orderBy: { timestamp: 'desc' },
        take: 20,
      }),
    ]);

    const results: any[] = [];
    for (const rule of rules) {
      const res = this.rulesEngine.evaluateRule(rule, assets, recentTransactions);
      results.push(res);

      if (res.triggered) {
        // Create an insight
        await this.prisma.agentInsight.create({
          data: {
            treasuryId,
            title: `Rule Alert: ${res.ruleName}`,
            description: res.reason,
            type: 'SECURITY',
            severity: 'WARNING',
            metadata: {
              ruleId: rule.id,
              suggestedAction: res.suggestedAction,
            },
          },
        });

        // If action suggested, record agent action
        if (res.suggestedAction) {
          await this.prisma.agentAction.create({
            data: {
              treasuryId,
              ruleId: rule.id,
              type: (res.suggestedAction.type as any) || 'NOTIFY',
              payload: res.suggestedAction.payload,
              status: 'PENDING',
            },
          });
        }
      }
    }

    return {
      evaluatedCount: rules.length,
      triggeredCount: results.filter((r) => r.triggered).length,
      results,
    };
  }
}
