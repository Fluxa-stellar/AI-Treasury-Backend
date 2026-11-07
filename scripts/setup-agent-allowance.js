import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
  parseUnits,
  isAddress,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const rpcUrl = process.env.AEVUM_RPC_URL || 'https://rpc-test.qday.info';
const chainId = parseInt(process.env.AEVUM_CHAIN_ID || '44005', 10);
const contractAddress = process.env.TREASURY_CONTRACT_ADDRESS;
const rawPrivateKey = process.env.AEVUM_PLATFORM_PRIVATE_KEY || process.env.BNB_PLATFORM_PRIVATE_KEY;

if (!rawPrivateKey) {
  console.error('[Error] AEVUM_PLATFORM_PRIVATE_KEY missing in .env');
  process.exit(1);
}

const privateKey = rawPrivateKey.startsWith('0x') ? rawPrivateKey : `0x${rawPrivateKey}`;
const ownerAccount = privateKeyToAccount(privateKey);

const aevumTestnet = defineChain({
  id: chainId,
  name: 'Aevum Testnet',
  nativeCurrency: { name: 'tQDAY', symbol: 'tQDAY', decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl] } },
  blockExplorers: {
    default: { name: 'QDay Explorer', url: process.env.BLOCKCHAIN_EXPLORER_URL || 'https://explorer-test.qday.info' },
  },
});

const publicClient = createPublicClient({
  chain: aevumTestnet,
  transport: http(rpcUrl),
});

const walletClient = createWalletClient({
  account: ownerAccount,
  chain: aevumTestnet,
  transport: http(rpcUrl),
});

const artifactPath = path.resolve(__dirname, '../src/blockchain/abis/AevumAgentVault.json');
const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
const AEVUM_AGENT_VAULT_ABI = artifact.abi;

async function main() {
  console.log('===============================================================');
  console.log('      ⚙️  AevumAgentVault - Authorize AI Agent Budget           ');
  console.log('===============================================================');

  if (!contractAddress || !isAddress(contractAddress)) {
    console.error('[Error] TREASURY_CONTRACT_ADDRESS is not set in .env.');
    console.error('Deploy the contract first with: node scripts/deploy-aevum.js');
    process.exit(1);
  }

  const targetVault = contractAddress;
  // By default, authorize the platform account (or specify an agent address via CLI argument)
  const agentToAuthorize = process.argv[2] || ownerAccount.address;

  if (!isAddress(agentToAuthorize)) {
    console.error(`[Error] Invalid agent address: ${agentToAuthorize}`);
    process.exit(1);
  }

  const dailyAllowance = parseUnits('100', 6); // 100 tUSD8 / day
  const maxTx = parseUnits('25', 6);           // 25 tUSD8 max per tx
  const durationSeconds = 86400n;               // 24 hours
  const enforceWhitelist = false;

  console.log(`Vault Address   : ${targetVault}`);
  console.log(`Agent to Config : ${agentToAuthorize}`);
  console.log(`Daily Limit     : 100 tUSD8`);
  console.log(`Max Single Tx   : 25 tUSD8`);
  console.log(`Reset Period    : 24 hours`);

  console.log('\n[Vault Owner] Sending setAgentConfig transaction...');

  const hash = await walletClient.writeContract({
    address: targetVault,
    abi: AEVUM_AGENT_VAULT_ABI,
    functionName: 'setAgentConfig',
    args: [agentToAuthorize, dailyAllowance, maxTx, durationSeconds, enforceWhitelist],
  });

  console.log(`Transaction Hash: ${hash}`);
  console.log(`Waiting for confirmation...`);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`✅ Agent successfully authorized in block ${receipt.blockNumber}!`);
  console.log(`🔗 Explorer: https://explorer-test.qday.info/tx/${hash}\n`);
}

main().catch((err) => {
  console.error('[Error]:', err);
  process.exit(1);
});

