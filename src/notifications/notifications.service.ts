import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';

export interface DisbursementNotification {
  agent: string;
  recipient: string;
  amount: string;
  token?: string;
  memo?: string;
  txHash?: string;
  network?: string;
  treasuryId?: string;
}

export interface SecurityNotification {
  agent: string;
  attemptedAmount: string;
  limit: string;
  reason: string;
  treasuryId?: string;
}

export interface BudgetWarningNotification {
  agent: string;
  percentUsed: number;
  spent: string;
  limit: string;
  treasuryId?: string;
}

export interface ApprovalNotification {
  proposalId: string;
  amount: string;
  token?: string;
  proposedBy: string;
  reason: string;
  treasuryId?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private botToken: string | null = null;
  private chatId: string | null = null;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.botToken = this.configService.get<string>('telegramBotToken') || null;
    this.chatId = this.configService.get<string>('telegramChatId') || null;

    if (this.isConfigured()) {
      this.logger.log('Telegram Notifications active and configured.');
    } else {
      this.logger.warn(
        'Telegram Notifications unconfigured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env.',
      );
    }
  }

  isConfigured(): boolean {
    return Boolean(this.botToken && this.chatId);
  }

  getChannelInfo(): { configured: boolean; targetChat?: string } {
    return {
      configured: this.isConfigured(),
      targetChat: this.chatId ? `${this.chatId.slice(0, 4)}***` : undefined,
    };
  }

  /**
   * Core dispatcher to send a message to Telegram via the official Bot API.
   */
  async sendTelegramRaw(
    text: string,
    parseMode: 'HTML' | 'Markdown' = 'HTML',
  ): Promise<boolean> {
    if (!this.botToken || !this.chatId) {
      this.logger.debug(`[Telegram Disabled] Would have sent: ${text}`);
      return false;
    }

    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text,
          parse_mode: parseMode,
          disable_web_page_preview: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        this.logger.error(`Telegram API error (${response.status}): ${errorData}`);
        return false;
      }

      return true;
    } catch (error: any) {
      this.logger.error(`Failed to dispatch Telegram notification: ${error.message}`);
      return false;
    }
  }

  /**
   * Alert: An autonomous AI agent successfully settled a payment on Aevum Testnet.
   */
  async notifyDisbursement(data: DisbursementNotification): Promise<boolean> {
    const token = data.token || 'tUSD8';
    const network = data.network || 'Aevum Testnet (Chain ID 44005)';
    const explorerUrl = data.txHash
      ? `https://explorer-test.qday.info/tx/${data.txHash}`
      : 'https://explorer-test.qday.info';

    const shortAgent = `${data.agent.slice(0, 6)}...${data.agent.slice(-4)}`;
    const shortRecipient = `${data.recipient.slice(0, 6)}...${data.recipient.slice(-4)}`;

    const htmlMessage = [
      `🤖 <b>AI Agent Disbursement Settled</b>`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `💰 <b>Amount:</b> <code>${data.amount} ${token}</code>`,
      `👤 <b>Agent:</b> <code>${shortAgent}</code>`,
      `🎯 <b>Recipient:</b> <code>${shortRecipient}</code>`,
      data.memo ? `📝 <b>Purpose:</b> <i>${data.memo}</i>` : '',
      `🌐 <b>Network:</b> ${network}`,
      `🔗 <a href="${explorerUrl}">View on Aevum Explorer</a>`,
    ]
      .filter(Boolean)
      .join('\n');

    // 1. Dispatch Telegram
    const telegramSent = await this.sendTelegramRaw(htmlMessage, 'HTML');

    // 2. Persist In-App Notification (AgentInsight)
    if (data.treasuryId) {
      try {
        await this.prisma.agentInsight.create({
          data: {
            treasuryId: data.treasuryId,
            title: `Disbursement Settled: ${data.amount} ${token}`,
            description: `Agent ${shortAgent} transferred ${data.amount} ${token} to ${shortRecipient} for "${data.memo || 'Operational expense'}".`,
            type: 'SPENDING',
            severity: 'SUCCESS',
            metadata: {
              agent: data.agent,
              recipient: data.recipient,
              amount: data.amount,
              token,
              txHash: data.txHash,
              explorerUrl,
            },
          },
        });
      } catch (err: any) {
        this.logger.warn(`Failed to store in-app insight: ${err.message}`);
      }
    }

    return telegramSent;
  }

  /**
   * Alert: Smart contract safety containment intercepted an over-budget spend attempt.
   */
  async notifySecurityBreach(data: SecurityNotification): Promise<boolean> {
    const shortAgent = `${data.agent.slice(0, 6)}...${data.agent.slice(-4)}`;

    const htmlMessage = [
      `🚨 <b>SECURITY CONTAINMENT TRIGGERED</b>`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🛡️ <b>Vault Smart Contract blocked an unauthorized request!</b>`,
      ``,
      `👤 <b>Agent:</b> <code>${shortAgent}</code>`,
      `⚠️ <b>Attempted Spend:</b> <code>${data.attemptedAmount} tUSD8</code>`,
      `🔒 <b>Configured Ceiling:</b> <code>${data.limit} tUSD8</code>`,
      `🛑 <b>Revert Reason:</b> ${data.reason}`,
      `✅ <b>Status:</b> Safe (Blocked on-chain by AevumAgentVault)`,
    ].join('\n');

    const telegramSent = await this.sendTelegramRaw(htmlMessage, 'HTML');

    if (data.treasuryId) {
      try {
        await this.prisma.agentInsight.create({
          data: {
            treasuryId: data.treasuryId,
            title: `🛡️ Security Alert: Unauthorized Spend Blocked`,
            description: `Agent ${shortAgent} attempted to disburse ${data.attemptedAmount} tUSD8 (limit: ${data.limit} tUSD8). Blocked on-chain by vault.`,
            type: 'SECURITY',
            severity: 'CRITICAL',
            metadata: {
              agent: data.agent,
              attemptedAmount: data.attemptedAmount,
              limit: data.limit,
              reason: data.reason,
            },
          },
        });
      } catch (err: any) {
        this.logger.warn(`Failed to store in-app insight: ${err.message}`);
      }
    }

    return telegramSent;
  }

  /**
   * Alert: An agent has consumed 80%+ of its daily allowance.
   */
  async notifyBudgetWarning(data: BudgetWarningNotification): Promise<boolean> {
    const shortAgent = `${data.agent.slice(0, 6)}...${data.agent.slice(-4)}`;

    const htmlMessage = [
      `⚠️ <b>Agent Allowance Threshold Warning</b>`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `👤 <b>Agent:</b> <code>${shortAgent}</code>`,
      `📊 <b>Quota Used:</b> <b>${data.percentUsed}%</b>`,
      `💵 <b>Spent Today:</b> <code>${data.spent} tUSD8</code> / <code>${data.limit} tUSD8</code>`,
      `ℹ️ <i>Spending will be paused once the daily limit is reached.</i>`,
    ].join('\n');

    const telegramSent = await this.sendTelegramRaw(htmlMessage, 'HTML');

    if (data.treasuryId) {
      try {
        await this.prisma.agentInsight.create({
          data: {
            treasuryId: data.treasuryId,
            title: `⚠️ Budget Warning: Agent at ${data.percentUsed}% Quota`,
            description: `Agent ${shortAgent} has spent ${data.spent} of ${data.limit} tUSD8 daily limit.`,
            type: 'SPENDING',
            severity: 'WARNING',
            metadata: {
              agent: data.agent,
              percentUsed: data.percentUsed,
              spent: data.spent,
              limit: data.limit,
            },
          },
        });
      } catch (err: any) {
        this.logger.warn(`Failed to store in-app insight: ${err.message}`);
      }
    }

    return telegramSent;
  }

  /**
   * Alert: A high-value disbursement requires human approval.
   */
  async notifyApprovalRequired(data: ApprovalNotification): Promise<boolean> {
    const token = data.token || 'tUSD8';

    const htmlMessage = [
      `📝 <b>Disbursement Requires Owner Approval</b>`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `💰 <b>Amount:</b> <code>${data.amount} ${token}</code>`,
      `👤 <b>Proposed By:</b> <code>${data.proposedBy}</code>`,
      `📌 <b>Reason:</b> ${data.reason}`,
      `🆔 <b>Proposal ID:</b> <code>${data.proposalId}</code>`,
      ``,
      `👉 <i>Log into your Treasury Dashboard to Approve or Reject this payment.</i>`,
    ].join('\n');

    return this.sendTelegramRaw(htmlMessage, 'HTML');
  }

  /**
   * Send a custom or test message.
   */
  async sendCustomAlert(
    title: string,
    message: string,
    severity: 'info' | 'warning' | 'critical' | 'success' = 'info',
    treasuryId?: string,
  ): Promise<boolean> {
    const icons = {
      info: 'ℹ️',
      warning: '⚠️',
      critical: '🚨',
      success: '✅',
    };

    const icon = icons[severity] || 'ℹ️';

    const htmlMessage = [
      `${icon} <b>${title}</b>`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
      message,
    ].join('\n');

    const telegramSent = await this.sendTelegramRaw(htmlMessage, 'HTML');

    if (treasuryId) {
      try {
        const severityMap = {
          info: 'INFO' as const,
          warning: 'WARNING' as const,
          critical: 'CRITICAL' as const,
          success: 'SUCCESS' as const,
        };

        await this.prisma.agentInsight.create({
          data: {
            treasuryId,
            title,
            description: message,
            type: 'TREASURY_HEALTH',
            severity: severityMap[severity] || 'INFO',
          },
        });
      } catch (err: any) {
        this.logger.warn(`Failed to store in-app insight: ${err.message}`);
      }
    }

    return telegramSent;
  }
}
