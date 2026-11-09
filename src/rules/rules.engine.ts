import { Injectable, Logger } from '@nestjs/common';
import { Rule, TreasuryAsset, Transaction } from '../../generated/prisma/client.js';

export interface EvaluationResult {
  ruleId: string;
  ruleName: string;
  triggered: boolean;
  reason: string;
  suggestedAction?: {
    type: string;
    payload: Record<string, any>;
  };
}

@Injectable()
export class RulesEngine {
  private readonly logger = new Logger(RulesEngine.name);

  evaluateRule(
    rule: Rule,
    assets: TreasuryAsset[],
    recentTransactions: Transaction[],
  ): EvaluationResult {
    const condition = (rule.condition as Record<string, any>) || {};
    const action = (rule.action as Record<string, any>) || {};

    switch (rule.type) {
      case 'LOW_BALANCE': {
        const threshold = parseFloat(condition.threshold || '0');
        const tokenSymbol = (condition.token || 'tUSD8').toUpperCase();

        const asset = assets.find((a) => a.symbol.toUpperCase() === tokenSymbol);
        const currentBalance = asset ? parseFloat(asset.balance.toString()) : 0;

        if (currentBalance < threshold) {
          return {
            ruleId: rule.id,
            ruleName: rule.name,
            triggered: true,
            reason: `${tokenSymbol} balance (${currentBalance}) is below the required threshold of ${threshold}`,
            suggestedAction: {
              type: 'NOTIFY',
              payload: {
                message: `Treasury low balance alert: ${tokenSymbol} is at ${currentBalance}, threshold is ${threshold}`,
                severity: 'WARNING',
              },
            },
          };
        }
        break;
      }

      case 'LARGE_TRANSACTION': {
        const threshold = parseFloat(condition.threshold || '0');
        const tokenSymbol = (condition.token || 'tUSD8').toUpperCase();
        const largeTx = recentTransactions.find(
          (tx) =>
            parseFloat(tx.amount.toString()) >= threshold &&
            (!tx.tokenSymbol || tx.tokenSymbol.toUpperCase() === tokenSymbol),
        );

        if (largeTx) {
          return {
            ruleId: rule.id,
            ruleName: rule.name,
            triggered: true,
            reason: `Transaction of ${largeTx.amount} ${largeTx.tokenSymbol || tokenSymbol} exceeds configured threshold of ${threshold}`,
            suggestedAction: {
              type: 'NOTIFY',
              payload: {
                txHash: largeTx.txHash,
                amount: largeTx.amount.toString(),
                severity: 'CRITICAL',
              },
            },
          };
        }
        break;
      }

      case 'EXCESS_BALANCE': {
        const threshold = parseFloat(condition.threshold || '0.80');
        const tokenSymbol = (condition.token || 'tUSD8').toUpperCase();
        const asset = assets.find((a) => a.symbol.toUpperCase() === tokenSymbol);
        const currentBalance = asset ? parseFloat(asset.balance.toString()) : 0;

        if (currentBalance > threshold) {
          const excess = currentBalance - threshold;
          return {
            ruleId: rule.id,
            ruleName: rule.name,
            triggered: true,
            reason: `${tokenSymbol} balance (${currentBalance}) exceeds operating threshold of ${threshold}. Excess: ${excess}`,
            suggestedAction: {
              type: 'RECOMMEND',
              payload: {
                message: `Consider moving ${excess.toFixed(2)} ${tokenSymbol} to reserve or cold storage`,
                amount: excess.toString(),
                token: tokenSymbol,
              },
            },
          };
        }
        break;
      }
        break;
      }

      default:
        break;
    }

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      triggered: false,
      reason: 'Condition not met',
    };
  }
}

