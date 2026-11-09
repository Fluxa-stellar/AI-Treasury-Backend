import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createPublicClient,
  http,
  PublicClient,
  formatUnits,
  isAddress,
  getAddress,
  defineChain,
  Chain,
} from 'viem';
import { bscTestnet, bsc } from 'viem/chains';
import { BEP20_ABI } from './abis/bep20.abi.js';

export const aevumTestnet = defineChain({
  id: 44005,
  name: 'Aevum Testnet',
  nativeCurrency: { name: 'tQDAY', symbol: 'tQDAY', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc-test.qday.info'] },
  },
  blockExplorers: {
    default: { name: 'QDay Explorer', url: 'https://explorer-test.qday.info' },
  },
});

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
  private networkName: string;
  private tusd8Address: string;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.networkName = this.configService.get<string>(
      'blockchainNetwork',
      'aevum-testnet',
    );
    this.tusd8Address = this.configService
      .get<string>('tusd8TokenAddress', '0x456569838f1d43009A91ebA4263147Afd7233483')
      .toLowerCase();

    let chain: Chain;
    let rpcUrl: string;

    if (this.networkName === 'aevum-testnet' || this.configService.get<number>('aevumChainId') === 44005) {
      this.chainId = this.configService.get<number>('aevumChainId', 44005);
      rpcUrl = this.configService.get<string>(
        'aevumRpcUrl',
        'https://rpc-test.qday.info',
      );
      chain = aevumTestnet;
    } else {
      this.chainId = this.configService.get<number>('bnbChainId', 97);
      rpcUrl = this.configService.get<string>(
        'bnbRpcUrl',
        'https://bsc-testnet-rpc.publicnode.com',
      );
      chain = this.chainId === 56 ? bsc : bscTestnet;
    }

    this.client = createPublicClient({
      chain,
      transport: http(rpcUrl, {
        retryCount: 3,
        retryDelay: 1000,
        timeout: 15000,
      }),
    });

    this.logger.log(
      `BlockchainService initialized on network: ${this.networkName} (Chain ID: ${this.chainId}, ${chain.name}) via RPC ${rpcUrl}`,
    );
  }

  getClient(): PublicClient {
    return this.client;
  }

  getChainId(): number {
    return this.chainId;
  }

  getNetworkName(): string {
    return this.networkName;
  }

  isAevum(): boolean {
    return this.chainId === 44005 || this.networkName === 'aevum-testnet';
  }

  getNativeSymbol(): string {
    return this.isAevum() ? 'tQDAY' : 'BNB';
  }

  async getNativeBalance(address: string): Promise<{ raw: bigint; formatted: string; symbol: string }> {
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
        symbol: this.getNativeSymbol(),
      };
    } catch (error) {
      this.logger.error(`Failed to fetch native balance for ${address}:`, error);
      return { raw: 0n, formatted: '0', symbol: this.getNativeSymbol() };
    }
  }

  async getNativeBnbBalance(address: string): Promise<{ raw: bigint; formatted: string }> {
    const res = await this.getNativeBalance(address);
    return { raw: res.raw, formatted: res.formatted };
  }

  async getTokenMetadata(tokenAddress: string): Promise<TokenMetadata> {
    if (!isAddress(tokenAddress)) {
      throw new Error(`Invalid token address: ${tokenAddress}`);
    }

    const lower = tokenAddress.toLowerCase();

    // Fast-path known Aevum tUSD8 stablecoin
    if (lower === this.tusd8Address) {
      return {
        address: lower,
        name: 'Test USD8',
        symbol: 'tUSD8',
        decimals: 6,
      };
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
        address: lower,
        name,
        symbol,
        decimals: Number(decimals),
      };
    } catch (error) {
      this.logger.warn(`Could not read ERC20/BEP20 metadata for ${tokenAddress}, using defaults: ${error.message}`);
      return {
        address: lower,
        name: 'Token',
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

    // Handle Native currency token address 0x0
    if (
      tokenAddress === '0x0000000000000000000000000000000000000000' ||
      tokenAddress.toLowerCase() === 'native'
    ) {
      const native = await this.getNativeBalance(accountAddress);
      return {
        tokenAddress: '0x0000000000000000000000000000000000000000',
        symbol: native.symbol,
        name: native.symbol,
        decimals: 18,
        balanceRaw: native.raw.toString(),
        balanceFormatted: native.formatted,
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
