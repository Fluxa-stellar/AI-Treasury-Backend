import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { SYSTEM_TREASURY_AGENT_PROMPT } from './prompts/treasury-agent.prompt.js';

export interface StructuredAiResponse {
  reply: string;
  insights: Array<{
    title: string;
    description: string;
    type: 'BALANCE' | 'SPENDING' | 'PERFORMANCE' | 'SECURITY' | 'ANOMALY';
    severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    actionType: string;
    amount?: string | null;
    tokenSymbol?: string | null;
    recipientAddress?: string | null;
  }>;
}

@Injectable()
export class AgentAiService {
  private readonly logger = new Logger(AgentAiService.name);
  private groq: Groq | null = null;
  private model: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('aiApiKey');
    this.model = this.configService.get<string>('aiModel', 'llama-3.3-70b-versatile');

    if (apiKey) {
      this.groq = new Groq({ apiKey });
      this.logger.log(`AgentAiService initialized with Groq model ${this.model}`);
    } else {
      this.logger.warn('AI_API_KEY is not set. AI agent will use deterministic fallback analyzer.');
    }
  }

  async generateResponse(
    userMessage: string,
    treasuryContext: Record<string, any>,
    conversationHistory: Array<{ role: 'USER' | 'ASSISTANT'; content: string }> = [],
  ): Promise<StructuredAiResponse> {
    if (!this.groq) {
      return this.generateFallbackResponse(userMessage, treasuryContext);
    }

    try {
      const messages: any[] = [
        {
          role: 'system',
          content: `${SYSTEM_TREASURY_AGENT_PROMPT}\n\nCURRENT VERIFIED TREASURY CONTEXT:\n${JSON.stringify(
            treasuryContext,
            null,
            2,
          )}`,
        },
      ];

      // Add last 6 turns of conversation history
      for (const turn of conversationHistory.slice(-6)) {
        messages.push({
          role: turn.role === 'USER' ? 'user' : 'assistant',
          content: turn.content,
        });
      }

      messages.push({
        role: 'user',
        content: userMessage,
      });

      // Try with configured model, fallback to llama-3.3-70b-versatile if invalid model name
      let completion;
      try {
        completion = await this.groq.chat.completions.create({
          model: this.model,
          messages,
          response_format: { type: 'json_object' },
          temperature: 0.2,
          max_completion_tokens: 1500,
        });
      } catch (err) {
        this.logger.warn(`Primary model ${this.model} failed, attempting fallback to llama-3.3-70b-versatile: ${err.message}`);
        completion = await this.groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages,
          response_format: { type: 'json_object' },
          temperature: 0.2,
          max_completion_tokens: 1500,
        });
      }

      const content = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);

      return {
        reply: parsed.reply || 'Analysis complete.',
        insights: Array.isArray(parsed.insights) ? parsed.insights : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      };
    } catch (error) {
      this.logger.error(`AI provider completion error: ${error.message}`, error.stack);
      return this.generateFallbackResponse(userMessage, treasuryContext);
    }
  }

  private generateFallbackResponse(
    userMessage: string,
    context: Record<string, any>,
  ): StructuredAiResponse {
    const assets = context.assets || [];
    const bnbBalance = context.nativeBnbBalance || '0';
    const recentTxCount = context.recentTxCount || 0;

    const lower = userMessage.toLowerCase();
    let reply = `Your treasury has a native BNB balance of ${bnbBalance} BNB with ${assets.length} tracked asset(s) and ${recentTxCount} recent transactions on BNB Chain.`;

    if (lower.includes('unusual') || lower.includes('suspicious') || lower.includes('anomal')) {
      reply = `I analyzed your ${recentTxCount} recent transactions. No critical security anomalies were detected outside your configured spending rules.`;
    } else if (lower.includes('allocat') || lower.includes('asset') || lower.includes('balance')) {
      const assetList = assets.map((a: any) => `${a.symbol}: ${a.balance}`).join(', ');
      reply = `Asset breakdown: ${assetList || 'BNB only'}. Note that real-time USD conversion is currently pending price oracle feeds.`;
    }

    return {
      reply,
      insights: [
        {
          title: 'Treasury Balance Status',
          description: `Active balance: ${bnbBalance} BNB across ${assets.length} token(s).`,
          type: 'BALANCE',
          severity: 'INFO',
        },
      ],
      recommendations: [],
    };
  }
}

