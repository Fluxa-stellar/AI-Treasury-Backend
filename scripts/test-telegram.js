import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

console.log('===============================================================');
console.log('     ✈️  Telegram Notification Channel Diagnostic Tool         ');
console.log('===============================================================');

if (!botToken) {
  console.error('\n❌ TELEGRAM_BOT_TOKEN is missing in your .env file!');
  console.log('\nQuick Setup (takes 2 minutes):');
  console.log(' 1. Open Telegram and search for "@BotFather".');
  console.log(' 2. Send the command: /newbot');
  console.log(' 3. Follow the prompts to name your bot (e.g. "AevumTreasuryBot").');
  console.log(' 4. Copy the HTTP API token provided by BotFather.');
  console.log(' 5. Add to .env: TELEGRAM_BOT_TOKEN=your_token_here\n');
  process.exit(1);
}

console.log('• Bot Token : Detected (', botToken.slice(0, 10), '...)');

async function main() {
  // 1. Verify Bot via getMe
  console.log('\n[Step 1] Verifying Bot Identity with Telegram API...');
  const meRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
  const meData = await meRes.json();

  if (!meData.ok) {
    console.error('❌ Invalid Bot Token! Telegram error:', meData.description);
    process.exit(1);
  }

  console.log(`✅ Connected as @${meData.result.username} (${meData.result.first_name})`);

  // 2. Check Chat ID
  if (!chatId) {
    console.log('\n⚠️  TELEGRAM_CHAT_ID is missing in your .env file.');
    console.log('[Step 2] Scanning recent incoming messages for your Chat ID...');
    
    const updatesRes = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`);
    const updatesData = await updatesRes.json();

    if (updatesData.ok && updatesData.result && updatesData.result.length > 0) {
      const lastMsg = updatesData.result[updatesData.result.length - 1];
      const detectedChat = lastMsg.message?.chat || lastMsg.channel_post?.chat;
      if (detectedChat) {
        console.log(`\n🎉 Found Chat ID: ${detectedChat.id} (${detectedChat.first_name || detectedChat.title || 'Private'})`);
        console.log(`➡️  Add this line to your .env file:`);
        console.log(`   TELEGRAM_CHAT_ID=${detectedChat.id}\n`);
        return;
      }
    }

    console.log(`\n👉 To discover your Chat ID:`);
    console.log(` 1. Open Telegram and start a chat with your bot: https://t.me/${meData.result.username}`);
    console.log(` 2. Press "START" or send any message (e.g. "hello").`);
    console.log(` 3. Run this script again: "node scripts/test-telegram.js"\n`);
    return;
  }

  console.log(`• Target Chat ID : ${chatId}`);

  // 3. Send Test Notification
  console.log('\n[Step 3] Sending test verification alert...');

  const html = [
    `🤖 <b>AI Treasury Agent - Telegram Channel Connected!</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🌐 <b>Network:</b> Aevum Testnet (Chain ID 44005)`,
    `🏦 <b>Vault:</b> <code>0x13487df8c92df39e8f71f86fc2da9873dbbd68aa</code>`,
    `💵 <b>Asset:</b> <code>tUSD8</code>`,
    ``,
    `✅ <i>You will receive real-time notifications for:</i>`,
    `• AI Agent micro-payments & compute refills`,
    `• Daily allowance threshold warnings (80% / 90%)`,
    `• 🛡️ Smart contract security blocks & containment alerts`,
    `• High-value disbursement approval requests`,
  ].join('\n');

  const sendRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: html,
      parse_mode: 'HTML',
    }),
  });

  const sendData = await sendRes.json();

  if (sendData.ok) {
    console.log('✅ Test alert delivered successfully to your Telegram!');
    console.log('Message ID:', sendData.result.message_id);
  } else {
    console.error('❌ Failed to send message:', sendData.description);
    console.log('Tip: Make sure you opened your bot in Telegram and clicked "Start" first.');
  }

  console.log('===============================================================\n');
}

main().catch((err) => {
  console.error('Diagnostic error:', err);
});

