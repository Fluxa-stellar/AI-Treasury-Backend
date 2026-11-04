export interface AppConfig {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  directUrl?: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  frontendUrl: string;
  bnbChainId: number;
  bnbNetwork: string;
  bnbRpcUrl: string;
  bnbPlatformPrivateKey?: string;
  treasuryContractAddress?: string;
  aiApiKey?: string;
  aiModel: string;
  redisUrl?: string;
}

export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  databaseUrl: process.env.DATABASE_URL || '',
  directUrl: process.env.DIRECT_URL,
  jwtSecret: process.env.JWT_SECRET || 'default-treasury-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  bnbChainId: parseInt(process.env.BNB_CHAIN_ID || '97', 10),
  bnbNetwork: process.env.BNB_NETWORK || 'testnet',
  bnbRpcUrl: process.env.BNB_RPC_URL || 'https://bsc-testnet-rpc.publicnode.com',
  bnbPlatformPrivateKey: process.env.BNB_PLATFORM_PRIVATE_KEY,
  treasuryContractAddress: process.env.TREASURY_CONTRACT_ADDRESS,
  aiApiKey: process.env.AI_API_KEY,
  aiModel: process.env.AI_MODEL || 'qwen/qwen3.8-27b',
  redisUrl: process.env.REDIS_URL,
});

