import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createPublicClient,
  http,
  PublicClient,
  formatUnits,
  isAddress,
  getAddress,
  parseAbiItem,
} from 'viem';
import { bscTestnet, bsc } from 'viem/chains';
import { BEP20_ABI } from './abis/bep20.abi.js';

export interface TokenMetadata {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
}

export interface TokenBalanceInfo {
  tokenAddress: string;
  symbol: string;
  name: string;
  decimals: number;
  balanceRaw: string;
  balanceFormatted: string;
}

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private client: PublicClient;
  private chainId: number;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const rpcUrl = this.configService.get<string>(
      'bnbRpcUrl',
      'https://bsc-testnet-rpc.publicnode.com',
    );
    this.chainId = this.configService.get<number>('bnbChainId', 97);

    const chain = this.chainId === 56 ? bsc : bscTestnet;

    this.client = createPublicClient({
      chain,
      transport: http(rpcUrl, {
        retryCount: 3,
        retryDelay: 1000,
        timeout: 15000,
      }),
    });

    this.logger.log(
      `BlockchainService initialized on chain ID ${this.chainId} (${chain.name}) with RPC ${rpcUrl}`,
    );
  }

  getClient(): PublicClient {
    return this.client;
  }

  getChainId(): number {
    return this.chainId;
  }

  async getNativeBnbBalance(address: string): Promise<{ raw: bigint; formatted: string }> {
    if (!isAddress(address)) {
      throw new Error(`Invalid address: ${address}`);
    }

    try {
      const balance = await this.client.getBalance({
        address: getAddress(address) as `0x${string}`,
      });
      return {
        raw: balance,
        formatted: formatUnits(balance, 18),
      };
    } catch (error) {
      this.logger.error(`Failed to fetch BNB balance for ${address}:`, error);
      return { raw: 0n, formatted: '0' };
    }
  }

  async getTokenMetadata(tokenAddress: string): Promise<TokenMetadata> {
    if (!isAddress(tokenAddress)) {
      throw new Error(`Invalid token address: ${tokenAddress}`);
    }

    const addr = getAddress(tokenAddress) as `0x${string}`;

    try {
      const [name, symbol, decimals] = await Promise.all([
        this.client.readContract({
          address: addr,
          abi: BEP20_ABI,
          functionName: 'name',
        }) as Promise<string>,
        this.client.readContract({
          address: addr,
          abi: BEP20_ABI,
          functionName: 'symbol',
        }) as Promise<string>,
        this.client.readContract({
          address: addr,
          abi: BEP20_ABI,
          functionName: 'decimals',
        }) as Promise<number>,
      ]);

      return {
        address: tokenAddress.toLowerCase(),
        name,
        symbol,
        decimals: Number(decimals),
      };
    } catch (error) {
      this.logger.warn(`Could not read full BEP20 metadata for ${tokenAddress}, using defaults: ${error.message}`);
      return {
        address: tokenAddress.toLowerCase(),
        name: 'Unknown Token',
        symbol: 'TOKEN',
        decimals: 18,
      };
    }
  }

  async getTokenBalance(
    tokenAddress: string,
    accountAddress: string,
  ): Promise<TokenBalanceInfo> {
    if (!isAddress(tokenAddress) || !isAddress(accountAddress)) {
      throw new Error('Invalid token or account address');
    }

    // Handle Native BNB token address 0x0
    if (
      tokenAddress === '0x0000000000000000000000000000000000000000' ||
      tokenAddress.toLowerCase() === 'native'
    ) {
      const bnb = await this.getNativeBnbBalance(accountAddress);
      return {
        tokenAddress: '0x0000000000000000000000000000000000000000',
        symbol: 'BNB',
        name: 'BNB',
        decimals: 18,
        balanceRaw: bnb.raw.toString(),
        balanceFormatted: bnb.formatted,
      };
    }

    const tAddr = getAddress(tokenAddress) as `0x${string}`;
    const accAddr = getAddress(accountAddress) as `0x${string}`;

    const metadata = await this.getTokenMetadata(tokenAddress);

    try {
      const balance = (await this.client.readContract({
        address: tAddr,
        abi: BEP20_ABI,
        functionName: 'balanceOf',
        args: [accAddr],
      })) as bigint;

      return {
        tokenAddress: metadata.address,
        symbol: metadata.symbol,
        name: metadata.name,
        decimals: metadata.decimals,
        balanceRaw: balance.toString(),
        balanceFormatted: formatUnits(balance, metadata.decimals),
      };
    } catch (error) {
      this.logger.error(`Error reading balance for ${tokenAddress} on ${accountAddress}:`, error);
      return {
        tokenAddress: metadata.address,
        symbol: metadata.symbol,
        name: metadata.name,
        decimals: metadata.decimals,
        balanceRaw: '0',
        balanceFormatted: '0',
      };
    }
  }

  async getTransactionReceipt(txHash: string) {
    try {
      const receipt = await this.client.getTransactionReceipt({
        hash: txHash as `0x${string}`,
      });
      return receipt;
    } catch (error) {
      this.logger.debug(`Receipt not yet available for ${txHash}: ${error.message}`);
      return null;
    }
  }

  async getBlockNumber(): Promise<bigint> {
    return this.client.getBlockNumber();
  }
}
