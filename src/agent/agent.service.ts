import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { TreasuryService } from '../treasury/treasury.service.js';
import { AgentAiService } from './agent-ai.service.js';
import { AgentAnalysisService } from './agent-analysis.service.js';
import { AgentChatDto } from './dto/agent-chat.dto.js';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(
    private prisma: PrismaService,
    private treasuryService: TreasuryService,
    private aiService: AgentAiService,
    private analysisService: AgentAnalysisService,
  ) {}

  private async verifyTreasuryAccess(treasuryId: string, userId: string) {
    const treasury = await this.prisma.treasury.findUnique({
      where: { id: treasuryId },
    });

    if (!treasury) {
      throw new NotFoundException('Treasury not found');
    }

    if (treasury.ownerId !== userId) {
      throw new ForbiddenException('Access denied to this treasury');
    }

    return treasury;
  }

  async chat(userId: string, dto: AgentChatDto) {
    await this.verifyTreasuryAccess(dto.treasuryId, userId);

    // 1. Save user message to database
    await this.prisma.agentMessage.create({
      data: {
        userId,
        treasuryId: dto.treasuryId,
        role: 'USER',
        content: dto.message,
      },
    });

    // 2. Fetch real treasury context
    const overview = await this.treasuryService.getOverview(dto.treasuryId, userId);

    // 3. Fetch past conversation turns
    const history = await this.prisma.agentMessage.findMany({
      where: { treasuryId: dto.treasuryId },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    // 4. Generate structured response from AI
    const aiResponse = await this.aiService.generateResponse(
      dto.message,
      overview,
      history.map((h) => ({
        role: h.role as 'USER' | 'ASSISTANT',
        content: h.content,
      })),
    );

    // 5. Save assistant message to database
    await this.prisma.agentMessage.create({
      data: {
        userId,
        treasuryId: dto.treasuryId,
        role: 'ASSISTANT',
        content: aiResponse.reply,
        metadata: {
          insightsCount: aiResponse.insights.length,
          recommendationsCount: aiResponse.recommendations.length,
        },
      },
    });

    // 6. Persist any new insights
    for (const insight of aiResponse.insights) {
      await this.prisma.agentInsight.create({
        data: {
          treasuryId: dto.treasuryId,
          title: insight.title,
          description: insight.description,
          type: (insight.type as any) || 'TREASURY_HEALTH',
          severity: (insight.severity as any) || 'INFO',
        },
      });
    }

    // 7. Persist any new recommendations
    for (const rec of aiResponse.recommendations) {
      await this.prisma.agentRecommendation.create({
        data: {
          treasuryId: dto.treasuryId,
          title: rec.title,
          description: rec.description,
          actionType: rec.actionType || 'TRANSFER',
          amount: rec.amount ? rec.amount : null,
          tokenSymbol: rec.tokenSymbol || null,
          recipientAddress: rec.recipientAddress || null,
          status: 'PENDING',
        },
      });
    }

    return aiResponse;
  }

  async getInsights(treasuryId: string, userId: string) {
    await this.verifyTreasuryAccess(treasuryId, userId);

    return this.prisma.agentInsight.findMany({
      where: { treasuryId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getRecommendations(treasuryId: string, userId: string) {
    await this.verifyTreasuryAccess(treasuryId, userId);

    return this.prisma.agentRecommendation.findMany({
      where: { treasuryId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getMessages(treasuryId: string, userId: string) {
    await this.verifyTreasuryAccess(treasuryId, userId);

    return this.prisma.agentMessage.findMany({
      where: { treasuryId },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
  }

  async analyzeTreasury(treasuryId: string, userId: string) {
    await this.verifyTreasuryAccess(treasuryId, userId);

    const [transactions, assets] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { treasuryId },
        orderBy: { timestamp: 'desc' },
        take: 50,
      }),
      this.prisma.treasuryAsset.findMany({
        where: { treasuryId },
      }),
    ]);

    const anomalies = this.analysisService.detectAnomalies(transactions, assets);

    // Save detected anomalies to agent insights
    const savedInsights: any[] = [];
    for (const anomaly of anomalies) {
      const insight = await this.prisma.agentInsight.create({
        data: {
          treasuryId,
          title: anomaly.title,
          description: anomaly.description,
          type: anomaly.type as any,
          severity: anomaly.severity as any,
          metadata: {
            reason: anomaly.reason,
            txHash: anomaly.txHash,
            suggestedNextStep: anomaly.suggestedNextStep,
          },
        },
      });
      savedInsights.push(insight);
    }

    return {
      analyzedTransactionsCount: transactions.length,
      anomaliesDetectedCount: anomalies.length,
      anomalies,
      savedInsights,
    };
  }
}
