import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 1. CORS Configuration
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'https://vaultiq-web.vercel.app',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for development & staging
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // 2. Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 3. Swagger OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('AI Treasury Agent API - Programmable Web3 Treasury')
    .setDescription(
      `### 🤖 Intelligent, Programmable Multi-Chain Treasury Platform

**AI Treasury Agent** provides an autonomous, AI-driven treasury backend that monitors balances, detects spending anomalies, and executes authorized disbursements through strictly bounded smart contracts.

---

### 🌐 Supported Networks
* **Aevum Testnet (QDay L2)**: 
  * **Chain ID**: \`44005\` | **RPC**: \`https://rpc-test.qday.info\`
  * **Primary Stablecoin**: \`tUSD8\` (\`0x456569838f1d43009A91ebA4263147Afd7233483\`, 6 decimals)
  * **Deployed Vault**: [\`0x13487df8c92df39e8f71f86fc2da9873dbbd68aa\`](https://explorer-test.qday.info/address/0x13487df8c92df39e8f71f86fc2da9873dbbd68aa)
  * **Core Focus**: Post-quantum security & Autonomous AI Agentic Economy.
* **BNB Smart Chain (BSC Testnet & Mainnet)**: 
  * **Chain ID**: \`97\` (Testnet) / \`56\` (Mainnet)
  * **Tokens**: Native BNB & BEP-20 tokens.

---

### ⚙️ Core Architecture & Security Model
1. **AI Proposes & Analyzes**: The AI agent evaluates spending requests, checks spending history, and detects anomalies.
2. **Smart Contract Enforces Limits**: The on-chain vault (\`AevumAgentVault.sol\`) strictly enforces per-agent daily spending limits, max-transaction caps, and recipient allowlists.
3. **Blockchain Settles**: Transactions settle securely on Aevum Testnet / BNB Chain with full on-chain auditability.

---

### 📱 Real-Time Notifications & Push Alerts
* **Telegram Bot**: Connected via [@VaultAI1bot](https://t.me/VaultAI1bot).
* **Automated Alerts**:
  * 🤖 **Disbursement Settled**: Instant alert when an AI agent completes a payment in \`tUSD8\` with an explorer link.
  * 🚨 **Security Containment**: Critical ping when the smart contract blocks an over-budget or unauthorized transfer.
  * ⚠️ **Budget Warnings**: Threshold notifications when an agent reaches 80%+ of its daily quota.
  * 📝 **Approval Requests**: Prompts the treasury owner when high-value transfers require human review.
* **Dual Delivery**: Every alert is dispatched to Telegram and stored as an in-app \`AgentInsight\` for the frontend notification feed.

---

### 🔑 Authentication Guide
1. **Generate Nonce**: Call \`POST /api/auth/nonce\` with your wallet address.
2. **Sign Challenge**: Sign the issued verification message in your Web3 wallet (e.g. MetaMask).
3. **Verify Signature**: Call \`POST /api/auth/verify\` with the signature to obtain a JWT bearer token.
4. **Authorize**: Click the **Authorize 🔓** button below and enter: \`Bearer <your_token>\`.
`,
    )
    .setVersion('1.4.0')
    .setExternalDoc('Aevum Builder Challenge #1 on DoraHacks', 'https://dorahacks.io')
    .addServer('http://localhost:3750', 'Local Development Server')
    .addServer('https://ai-treasury-backend.onrender.com', 'Render Cloud Server')
    .addTag('Auth', 'Web3 Nonce generation, cryptographic signature verification, and JWT session handling')
    .addTag('Treasury', 'Treasury vaults, asset tracking, live balance synchronizations, and status overviews')
    .addTag('AI Agent', 'Context-grounded AI conversational assistant, automated insights, and transaction recommendations')
    .addTag('Transactions', 'Disbursement proposals, execution tracking, and on-chain transaction history')
    .addTag('Approvals', 'Human-in-the-loop multi-step approval workflows for high-value or unusual disbursements')
    .addTag('Rules', 'Programmable treasury policies, spending limits, and automated trigger conditions')
    .addTag('Analytics', 'Financial inflows/outflows, asset distribution charts, and historical balance snapshots')
    .addTag('Wallets', 'Wallet portfolio management, address tracking, and owner associations')
    .addTag('Users', 'User account profiles and preferences')
    .addTag('Health', 'Real-time health monitoring, Neon PostgreSQL database status, and blockchain connectivity')
    .addTag('Notifications', 'Real-time Telegram push alerts, security containment notifications, and in-app feed')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT token (e.g., "Bearer eyJhbGciOi...")',
        in: 'header',
      },
      'bearer',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT token (e.g., "Bearer eyJhbGciOi...")',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'AI Treasury Agent API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      filter: true,
      displayRequestDuration: true,
      docExpansion: 'list',
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
    },
    customCss: `
      .swagger-ui .topbar { background-color: #0d1117; border-bottom: 2px solid #30363d; }
      .swagger-ui .topbar .topbar-wrapper .link svg { fill: #58a6ff; }
      .swagger-ui .info .title { color: #1f6feb; }
      .swagger-ui .btn.authorize { background-color: #238636; color: #fff; border-color: #2ea043; }
      .swagger-ui .btn.authorize svg { fill: #fff; }
    `,
  });

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');

  logger.log(`=======================================================`);
  logger.log(`🚀 AI Treasury Agent Backend running on port ${port}`);
  logger.log(`📚 Swagger Documentation: http://localhost:${port}/api/docs`);
  logger.log(`🩺 Health Check: http://localhost:${port}/api/health`);
  logger.log(`=======================================================`);
}

bootstrap();
