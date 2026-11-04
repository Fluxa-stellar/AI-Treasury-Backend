import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getAddress, isAddress, formatUnits } from 'viem';
import { BlockchainService } from './blockchain.service.js';
import { TREASURY_VAULT_ABI } from './abis/treasury-vault.abi.js';

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

  constructor(
    private blockchainService: BlockchainService,
    private configService: ConfigService,
  ) {
    this.defaultContractAddress = this.configService.get<string>('treasuryContractAddress', '');
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
      const owner = (await this.blockchainService.getClient().readContract({
        address,
        abi: TREASURY_VAULT_ABI,
        functionName: 'owner',
      })) as string;
      return owner.toLowerCase();
    } catch (error) {
      this.logger.warn(`Failed to read owner of vault ${address}: ${error.message}`);
      return null;
    }
  }

  async isVaultPaused(contractAddress?: string): Promise<boolean> {
    const address = this.resolveAddress(contractAddress);
    if (!address) return false;

    try {
      const paused = (await this.blockchainService.getClient().readContract({
        address,
        abi: TREASURY_VAULT_ABI,
        functionName: 'paused',
      })) as boolean;
      return paused;
    } catch (error) {
      this.logger.warn(`Failed to read paused state of vault ${address}: ${error.message}`);
      return false;
    }
  }

  async isAgentAuthorized(agentAddress: string, contractAddress?: string): Promise<boolean> {
    const address = this.resolveAddress(contractAddress);
    if (!address || !isAddress(agentAddress)) return false;

    try {
      const isAuth = (await this.blockchainService.getClient().readContract({
        address,
        abi: TREASURY_VAULT_ABI,
        functionName: 'authorizedAgents',
        args: [getAddress(agentAddress) as `0x${string}`],
      })) as boolean;
      return isAuth;
    } catch (error) {
      this.logger.warn(`Failed to check agent authorization: ${error.message}`);
      return false;
    }
  }

  async isRecipientApproved(recipientAddress: string, contractAddress?: string): Promise<boolean> {
    const address = this.resolveAddress(contractAddress);
    if (!address || !isAddress(recipientAddress)) return false;

    try {
      const approved = (await this.blockchainService.getClient().readContract({
        address,
        abi: TREASURY_VAULT_ABI,
        functionName: 'approvedRecipients',
        args: [getAddress(recipientAddress) as `0x${string}`],
      })) as boolean;
      return approved;
    } catch (error) {
      this.logger.warn(`Failed to check recipient approval: ${error.message}`);
      return false;
    }
  }

  async isTokenAllowed(tokenAddress: string, contractAddress?: string): Promise<boolean> {
    const address = this.resolveAddress(contractAddress);
    if (!address || !isAddress(tokenAddress)) return false;

    try {
      const allowed = (await this.blockchainService.getClient().readContract({
        address,
        abi: TREASURY_VAULT_ABI,
        functionName: 'allowedTokens',
        args: [getAddress(tokenAddress) as `0x${string}`],
      })) as boolean;
      return allowed;
    } catch (error) {
      this.logger.warn(`Failed to check token allowlist: ${error.message}`);
      return false;
    }
  }

  async getSpendingStatus(contractAddress?: string): Promise<SpendingStatus | null> {
    const address = this.resolveAddress(contractAddress);
    if (!address) return null;

    try {
      const result = (await this.blockchainService.getClient().readContract({
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
    } catch (error) {
      this.logger.warn(`Failed to read spending status from ${address}: ${error.message}`);
      return null;
    }
  }

  async getVaultBalance(tokenAddress: string, contractAddress?: string): Promise<string> {
    const address = this.resolveAddress(contractAddress);
    if (!address) return '0';

    try {
      const targetToken =
        tokenAddress === '0x0000000000000000000000000000000000000000' ||
        tokenAddress.toLowerCase() === 'native'
          ? '0x0000000000000000000000000000000000000000'
          : getAddress(tokenAddress);

      const balance = (await this.blockchainService.getClient().readContract({
        address,
        abi: TREASURY_VAULT_ABI,
        functionName: 'getBalance',
        args: [targetToken as `0x${string}`],
      })) as bigint;

      return formatUnits(balance, 18);
    } catch (error) {
      this.logger.warn(`Failed to get balance for token ${tokenAddress} from vault: ${error.message}`);
      return '0';
    }
  }
}
