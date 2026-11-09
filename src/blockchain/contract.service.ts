import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getAddress, isAddress, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { BlockchainService } from './blockchain.service.js';
import { TREASURY_VAULT_ABI } from './abis/treasury-vault.abi.js';
import { AEVUM_AGENT_VAULT_ABI } from './abis/aevum-agent-vault.abi.js';

export interface SpendingStatus {
  maxTransactionAmount: string;
  dailySpendingLimit: string;
  spentToday: string;
  remainingToday: string;
}

@Injectable()
export class ContractService {
  private readonly logger = new Logger(ContractService.name);
  private defaultContractAddress: string;
  private defaultAgentAddress: string | null = null;

  constructor(
    private blockchainService: BlockchainService,
    private configService: ConfigService,
  ) {
    this.defaultContractAddress = this.configService.get<string>('treasuryContractAddress', '');

    const rawKey =
      this.configService.get<string>('aevumPlatformPrivateKey') ||
      this.configService.get<string>('bnbPlatformPrivateKey');

    if (rawKey) {
      try {
        const pk = rawKey.startsWith('0x') ? rawKey : `0x${rawKey}`;
        const acc = privateKeyToAccount(pk as `0x${string}`);
        this.defaultAgentAddress = acc.address.toLowerCase();
      } catch {
        // Ignore invalid platform private key
      }
    }
  }

  getDefaultContractAddress(): string {
    return this.defaultContractAddress;
  }

  private resolveAddress(contractAddress?: string): `0x${string}` | null {
    const target = contractAddress || this.defaultContractAddress;
    if (!target || !isAddress(target)) {
      return null;
    }
    return getAddress(target) as `0x${string}`;
  }

  async getVaultOwner(contractAddress?: string): Promise<string | null> {
    const address = this.resolveAddress(contractAddress);
    if (!address) return null;

    try {
      const client = this.blockchainService.getClient();
      const abi = this.blockchainService.isAevum() ? AEVUM_AGENT_VAULT_ABI : TREASURY_VAULT_ABI;

      const owner = (await client.readContract({
        address,
        abi: abi as any,
        functionName: 'owner',
      })) as string;
      return owner.toLowerCase();
    } catch (error: any) {
      this.logger.debug(`Could not read owner of vault ${address}: ${error.message}`);
      return null;
    }
  }

  async isVaultPaused(contractAddress?: string): Promise<boolean> {
    const address = this.resolveAddress(contractAddress);
    if (!address) return false;

    try {
      const client = this.blockchainService.getClient();
      const abi = this.blockchainService.isAevum() ? AEVUM_AGENT_VAULT_ABI : TREASURY_VAULT_ABI;

      const paused = (await client.readContract({
        address,
        abi: abi as any,
        functionName: 'paused',
      })) as boolean;
      return paused;
    } catch (error: any) {
      this.logger.debug(`Could not read paused state of vault ${address}: ${error.message}`);
      return false;
    }
  }

  async isAgentAuthorized(agentAddress: string, contractAddress?: string): Promise<boolean> {
    const address = this.resolveAddress(contractAddress);
    if (!address || !isAddress(agentAddress)) return false;

    const formattedAgent = getAddress(agentAddress) as `0x${string}`;
    const client = this.blockchainService.getClient();

    if (this.blockchainService.isAevum()) {
      try {
        const result = (await client.readContract({
          address,
          abi: AEVUM_AGENT_VAULT_ABI,
          functionName: 'getAgentStatus',
          args: [formattedAgent],
        })) as [boolean, bigint, bigint, bigint, bigint, bigint];
        return Boolean(result[0]);
      } catch (error: any) {
        this.logger.debug(`Failed to check agent status on AevumAgentVault: ${error.message}`);
        return false;
      }
    }

    try {
      const isAuth = (await client.readContract({
        address,
        abi: TREASURY_VAULT_ABI,
        functionName: 'authorizedAgents',
        args: [formattedAgent],
      })) as boolean;
      return isAuth;
    } catch (error: any) {
      this.logger.debug(`Failed to check agent authorization: ${error.message}`);
      return false;
    }
  }

  async isRecipientApproved(recipientAddress: string, contractAddress?: string): Promise<boolean> {
    const address = this.resolveAddress(contractAddress);
    if (!address || !isAddress(recipientAddress)) return false;

    const formattedRecipient = getAddress(recipientAddress) as `0x${string}`;
    const client = this.blockchainService.getClient();

    if (this.blockchainService.isAevum()) {
      // On AevumAgentVault, recipients are configured per agent.
      return true;
    }

    try {
      const approved = (await client.readContract({
        address,
        abi: TREASURY_VAULT_ABI,
        functionName: 'approvedRecipients',
        args: [formattedRecipient],
      })) as boolean;
      return approved;
    } catch (error: any) {
      this.logger.debug(`Failed to check recipient approval: ${error.message}`);
      return false;
    }
  }

  async isTokenAllowed(tokenAddress: string, contractAddress?: string): Promise<boolean> {
    const address = this.resolveAddress(contractAddress);
    if (!address || !isAddress(tokenAddress)) return false;

    if (this.blockchainService.isAevum()) {
      // On AevumAgentVault, tUSD8 is the native primary token.
      return true;
    }

    try {
      const allowed = (await this.blockchainService.getClient().readContract({
        address,
        abi: TREASURY_VAULT_ABI,
        functionName: 'allowedTokens',
        args: [getAddress(tokenAddress) as `0x${string}`],
      })) as boolean;
      return allowed;
    } catch (error: any) {
      this.logger.debug(`Failed to check token allowlist: ${error.message}`);
      return false;
    }
  }

  async getSpendingStatus(
    contractAddress?: string,
    agentAddress?: string,
  ): Promise<SpendingStatus | null> {
    const address = this.resolveAddress(contractAddress);
    if (!address) return null;

    const client = this.blockchainService.getClient();

    // 1. Aevum Testnet (AevumAgentVault - per-agent allowances in tUSD8 6 decimals)
    if (this.blockchainService.isAevum()) {
      const targetAgent =
        agentAddress ||
        this.defaultAgentAddress ||
        (await this.getVaultOwner(contractAddress));

      if (!targetAgent || !isAddress(targetAgent)) {
        return {
          maxTransactionAmount: '0.25',
          dailySpendingLimit: '1.00',
          spentToday: '0.0',
          remainingToday: '1.00',
        };
      }

      try {
        const result = (await client.readContract({
          address,
          abi: AEVUM_AGENT_VAULT_ABI,
          functionName: 'getAgentStatus',
          args: [getAddress(targetAgent) as `0x${string}`],
        })) as [boolean, bigint, bigint, bigint, bigint, bigint];

        return {
          maxTransactionAmount: formatUnits(result[2], 6),
          dailySpendingLimit: formatUnits(result[1], 6),
          spentToday: formatUnits(result[3], 6),
          remainingToday: formatUnits(result[4], 6),
        };
      } catch (error: any) {
        this.logger.debug(`Could not read agent status from Aevum vault ${address}: ${error.message}`);
        return {
          maxTransactionAmount: '0',
          dailySpendingLimit: '0',
          spentToday: '0',
          remainingToday: '0',
        };
      }
    }

    // 2. BSC Testnet / Mainnet (TreasuryVault - global daily limit in 18 decimals)
    try {
      const result = (await client.readContract({
        address,
        abi: TREASURY_VAULT_ABI,
        functionName: 'getSpendingStatus',
      })) as [bigint, bigint, bigint, bigint];

      return {
        maxTransactionAmount: formatUnits(result[0], 18),
        dailySpendingLimit: formatUnits(result[1], 18),
        spentToday: formatUnits(result[2], 18),
        remainingToday: formatUnits(result[3], 18),
      };
    } catch (error: any) {
      this.logger.debug(`Could not read spending status from ${address}: ${error.message}`);
      return null;
    }
  }

  async getVaultBalance(tokenAddress?: string, contractAddress?: string): Promise<string> {
    const address = this.resolveAddress(contractAddress);
    if (!address) return '0';

    const client = this.blockchainService.getClient();

    // 1. Aevum Testnet (AevumAgentVault - holds tUSD8 with 6 decimals)
    if (this.blockchainService.isAevum()) {
      try {
        const balance = (await client.readContract({
          address,
          abi: AEVUM_AGENT_VAULT_ABI,
          functionName: 'getVaultBalance',
        })) as bigint;

        return formatUnits(balance, 6);
      } catch (error: any) {
        this.logger.debug(`Could not read tUSD8 balance from Aevum vault ${address}: ${error.message}`);
        return '0';
      }
    }

    // 2. BSC Testnet / Mainnet (TreasuryVault - multi-token with 18 decimals)
    try {
      const targetToken =
        !tokenAddress ||
        tokenAddress === '0x0000000000000000000000000000000000000000' ||
        tokenAddress.toLowerCase() === 'native'
          ? '0x0000000000000000000000000000000000000000'
          : getAddress(tokenAddress);

      const balance = (await client.readContract({
        address,
        abi: TREASURY_VAULT_ABI,
        functionName: 'getBalance',
        args: [targetToken as `0x${string}`],
      })) as bigint;

      return formatUnits(balance, 18);
    } catch (error: any) {
      this.logger.debug(`Could not read balance for token ${tokenAddress} from vault: ${error.message}`);
      return '0';
    }
  }
}
