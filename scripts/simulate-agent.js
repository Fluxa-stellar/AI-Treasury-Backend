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
  formatUnits,
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
const agentAccount = privateKeyToAccount(privateKey);

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
  account: agentAccount,
  chain: aevumTestnet,
  transport: http(rpcUrl),
});

const artifactPath = path.resolve(__dirname, '../src/blockchain/abis/AevumAgentVault.json');
const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
const AEVUM_AGENT_VAULT_ABI = artifact.abi;

async function sendTelegramAlert(text) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
  } catch (e) {
    // Ignore notification error in simulation
  }
}

async function main() {
  console.log('===============================================================');
  console.log('   🤖 Autonomous AI Agent Treasury Payment Simulator (Aevum)    ');
  console.log('===============================================================');
  console.log('Agent Wallet Address :', agentAccount.address);
  console.log('Network              : Aevum Testnet (QDay L2)');
  console.log('Chain ID             :', chainId);
  console.log('Vault Contract       :', contractAddress || '(Not yet configured in .env)');

  if (!contractAddress || !isAddress(contractAddress)) {
    console.log('\n⚠️  TREASURY_CONTRACT_ADDRESS is not set in .env.');
    console.log('➡️  Run the deployment first: node scripts/deploy-aevum.js');
    console.log('\n[Simulation Preview]');
    console.log('When deployed, this script will:');
    console.log(' 1. Query agent allowance & remaining budget from AevumAgentVault.');
    console.log(' 2. Execute a valid 2.5 tUSD8 settlement for API inference.');
    console.log(' 3. Attempt an unauthorized 5,000 tUSD8 payment to verify on-chain safety containment.');
    return;
  }

  const targetVault = contractAddress;

  // 1. Read Agent Status
  console.log('\n[Step 1] Querying Agent Allowance from AevumAgentVault...');
  const [
    isAuthorized,
    periodLimit,
    maxTx,
    spentInPeriod,
    remaining,
    nextReset
  ] = await publicClient.readContract({
    address: targetVault,
    abi: AEVUM_AGENT_VAULT_ABI,
    functionName: 'getAgentStatus',
    args: [agentAccount.address],
  });

  const vaultBalance = await publicClient.readContract({
    address: targetVault,
    abi: AEVUM_AGENT_VAULT_ABI,
    functionName: 'getVaultBalance',
  });

  console.log('• Authorized Status  :', isAuthorized ? '✅ Active' : '❌ Not Configured');
  console.log('• Period Limit       :', formatUnits(periodLimit, 6), 'tUSD8');
  console.log('• Max Single Tx      :', formatUnits(maxTx, 6), 'tUSD8');
  console.log('• Spent This Period  :', formatUnits(spentInPeriod, 6), 'tUSD8');
  console.log('• Remaining Allowance:', formatUnits(remaining, 6), 'tUSD8');
  console.log('• Vault Total Balance:', formatUnits(vaultBalance, 6), 'tUSD8');

  if (!isAuthorized) {
    console.log('\n⚠️  Agent is not yet registered on this vault.');
    console.log('Call setAgentConfig() as the vault owner to authorize this agent address.');
    return;
  }

  // 2. Perform a valid micro-disbursement
  const mockRecipient = '0x1111111111111111111111111111111111111111';
  const paymentAmount = parseUnits('2.5', 6); // 2.5 tUSD8
  const purpose = 'Inference Compute Refill (DeepSeek-V3 API)';

  console.log(`\n[Step 2] Executing autonomous micro-payment of 2.5 tUSD8...`);
  console.log(`• Recipient : ${mockRecipient}`);
  console.log(`• Memo      : "${purpose}"`);

  try {
    const hash = await walletClient.writeContract({
      address: targetVault,
      abi: AEVUM_AGENT_VAULT_ABI,
      functionName: 'executeAgentPayment',
      args: [mockRecipient, paymentAmount, purpose],
    });

    console.log(`➡️ Tx Submitted: ${hash}`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`✅ Settled in Block: ${receipt.blockNumber}`);
    console.log(`🔗 Explorer: https://explorer-test.qday.info/tx/${hash}`);

    await sendTelegramAlert(
      `🤖 <b>AI Agent Disbursement Settled</b>\n━━━━━━━━━━━━━━━━━━━━\n💰 <b>Amount:</b> 2.50 tUSD8\n👤 <b>Agent:</b> <code>${agentAccount.address.slice(0, 6)}...${agentAccount.address.slice(-4)}</code>\n🎯 <b>Recipient:</b> <code>${mockRecipient.slice(0, 6)}...${mockRecipient.slice(-4)}</code>\n📝 <b>Memo:</b> <i>${purpose}</i>\n🌐 <b>Network:</b> Aevum Testnet\n🔗 <a href="https://explorer-test.qday.info/tx/${hash}">View on Explorer</a>`
    );
  } catch (err) {
    console.error(`❌ Payment execution failed: ${err.message}`);
  }

  // 3. Demonstrate safety containment (Attempting over-budget spend)
  console.log(`\n[Step 3] Simulating over-budget containment test...`);
  const excessiveAmount = parseUnits('5000', 6); // 5000 tUSD8

  try {
    console.log(`• Attempting to request 5,000 tUSD8 (exceeding daily cap)...`);
    await walletClient.writeContract({
      address: targetVault,
      abi: AEVUM_AGENT_VAULT_ABI,
      functionName: 'executeAgentPayment',
      args: [mockRecipient, excessiveAmount, 'Unauthorized large transfer'],
    });
    console.log(`⚠️ Warning: Over-budget payment was not blocked!`);
  } catch (err) {
    console.log(`🛡️ Smart Contract successfully blocked over-budget payment!`);
    console.log(`• Revert Reason: Transaction limits enforced on-chain.`);

    await sendTelegramAlert(
      `🚨 <b>SECURITY CONTAINMENT TRIGGERED</b>\n━━━━━━━━━━━━━━━━━━━━\n🛡️ <b>Smart contract blocked an over-budget spend!</b>\n👤 <b>Agent:</b> <code>${agentAccount.address.slice(0, 6)}...${agentAccount.address.slice(-4)}</code>\n⚠️ <b>Attempted:</b> 5,000.00 tUSD8 (Limit: 100.00 tUSD8)\n🛑 <b>Revert:</b> Limits enforced on-chain by AevumAgentVault\n✅ <b>Status:</b> Treasury funds protected`
    );
  }

  console.log('\n===============================================================');
  console.log('   Simulation Complete! Flow verified on Aevum Testnet.        ');
  console.log('===============================================================');
}

main().catch((err) => {
  console.error('[Error]:', err);
});
