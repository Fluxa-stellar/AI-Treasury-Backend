import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
  formatEther,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const rpcUrl = process.env.AEVUM_RPC_URL || 'https://rpc-test.qday.info';
const chainId = parseInt(process.env.AEVUM_CHAIN_ID || '44005', 10);
const rawPrivateKey = process.env.AEVUM_PLATFORM_PRIVATE_KEY || process.env.BNB_PLATFORM_PRIVATE_KEY;
const tusd8Address = process.env.TUSD8_TOKEN_ADDRESS || '0x456569838f1d43009A91ebA4263147Afd7233483';

if (!rawPrivateKey) {
  console.error('[Error] AEVUM_PLATFORM_PRIVATE_KEY is missing in .env');
  process.exit(1);
}

const privateKey = rawPrivateKey.startsWith('0x') ? rawPrivateKey : `0x${rawPrivateKey}`;
const account = privateKeyToAccount(privateKey);

const aevumTestnet = defineChain({
  id: chainId,
  name: 'Aevum Testnet',
  nativeCurrency: { name: 'tQDAY', symbol: 'tQDAY', decimals: 18 },
  rpcUrls: {
    default: { http: [rpcUrl] },
  },
  blockExplorers: {
    default: { name: 'QDay Explorer', url: process.env.BLOCKCHAIN_EXPLORER_URL || 'https://explorer-test.qday.info' },
  },
});

const publicClient = createPublicClient({
  chain: aevumTestnet,
  transport: http(rpcUrl),
});

const walletClient = createWalletClient({
  account,
  chain: aevumTestnet,
  transport: http(rpcUrl),
});

async function main() {
  console.log('==================================================');
  console.log('   AevumAgentVault Deployment to Aevum Testnet   ');
  console.log('==================================================');
  console.log('Deployer Address :', account.address);
  console.log('Chain ID         :', chainId);
  console.log('RPC Endpoint     :', rpcUrl);
  console.log('tUSD8 Token      :', tusd8Address);

  const balance = await publicClient.getBalance({ address: account.address });
  console.log('Native Balance   :', formatEther(balance), 'tQDAY');

  if (balance === 0n) {
    console.error('\n[Error] Insufficient funds for gas!');
    console.error(`Please claim testnet tQDAY from the faucet:`);
    console.error(`➡️  https://faucet.qday.info`);
    console.error(`Address: ${account.address}\n`);
    process.exit(1);
  }

  const artifactPath = path.resolve(__dirname, '../src/blockchain/abis/AevumAgentVault.json');
  if (!fs.existsSync(artifactPath)) {
    console.error('[Error] Artifact not found! Run "node scripts/compile.js" first.');
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

  console.log('\n[Deployer] Deploying AevumAgentVault...');
  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    args: [tusd8Address],
  });

  console.log(`[Deployer] Transaction submitted. Hash: ${hash}`);
  console.log(`[Deployer] Waiting for confirmation...`);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const contractAddress = receipt.contractAddress;

  console.log('\n==================================================');
  console.log('✅ AevumAgentVault deployed successfully!');
  console.log('Contract Address :', contractAddress);
  console.log('Block Number     :', receipt.blockNumber.toString());
  console.log('Gas Used         :', receipt.gasUsed.toString());
  console.log(`Explorer Link    : https://explorer-test.qday.info/tx/${hash}`);
  console.log('==================================================\n');

  // Update .env
  const envPath = path.resolve(__dirname, '../.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('TREASURY_CONTRACT_ADDRESS=')) {
    envContent = envContent.replace(
      /TREASURY_CONTRACT_ADDRESS=.*/,
      `TREASURY_CONTRACT_ADDRESS=${contractAddress}`
    );
  } else {
    envContent += `\nTREASURY_CONTRACT_ADDRESS=${contractAddress}\n`;
  }
  fs.writeFileSync(envPath, envContent);
  console.log(`[Config] Updated TREASURY_CONTRACT_ADDRESS in .env with ${contractAddress}`);
}

main().catch((err) => {
  console.error('[Deployment Error]:', err);
  process.exit(1);
});

