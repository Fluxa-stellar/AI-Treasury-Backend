
# 🤖 AI Treasury Agent

> **An AI-powered programmable treasury that monitors blockchain activity, detects risks, recommends actions, and executes authorized transactions through a secure smart contract on BNB Chain.**

## 🚀 Overview

As autonomous AI agents evolve from read-only advisors into active economic participants, they need to pay for their own resources: LLM inference, vector storage, decentralized compute, data feeds, and sub-agent task coordination.

However, giving an autonomous AI agent unrestricted private key access or unlimited spending authority creates a massive security hazard. A hallucinating, compromised, or misconfigured agent could instantly drain an entire treasury.

**AI Treasury Agent** provides the critical security and management layer:
1. **The Human Owner sets the rules:** Programmatic per-agent daily allowances, single-transaction caps, reset intervals, and recipient allowlists.
2. **Autonomous Agents execute bounded micro-payments:** AI agents independently disburse `tUSD8` for operational compute and services without human intervention for low-risk actions.
3. **The Smart Contract (`AevumAgentVault.sol`) enforces the boundary:** Transactions that exceed daily limits or violate recipient policies are reverted immediately on-chain.
4. **Real-Time Human-in-the-Loop Alerts:** High-value transactions or security breach attempts trigger instant push notifications via Telegram and in-app feeds.

```
                      +-----------------------------+
                      |    Human Treasury Owner     |
                      | (Sets Quotas & Permissions) |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |     AevumAgentVault.sol     |
                      |  • tUSD8 Vault Balance      |
                      |  • Per-Agent Daily Caps     |
                      |  • Recipient Allowlist      |
                      |  • Emergency Pause Switch   |
                      +--------------+--------------+
                                     ^
                                     | (Settles tUSD8 on Aevum Testnet)
           +-------------------------+-------------------------+
           |                                                   |
+----------+------------+                           +----------+------------+
|  Autonomous Agent A   |                           |  Autonomous Agent B   |
| (e.g. Compute Buyer)  |                           | (e.g. Data Pipeline)  |
| • Requests: 2.5 tUSD8 |                           | • Requests: 5000 tUSD8|
| • Limit: 100 tUSD8/day|                           | • Limit: 100 tUSD8/day|
| • Result: ✅ APPROVED |                           | • Result: 🛡️ REVERTED |
+-----------------------+                           +-----------------------+
```

---

## 🎯 The Problem

Managing on-chain corporate and DAO treasuries in the era of autonomous agents creates critical challenges:

1. **Unrestricted Wallet Danger:** Granting private keys to autonomous agents leaves funds exposed to prompt injection, logic bugs, or model hallucinations.
2. **Manual Bottlenecks:** Requiring human multi-sig approvals for every $1 micro-payment for LLM API calls paralyzes autonomous operations.
3. **Lack of Agent Accountability:** Traditional wallets cannot differentiate between different AI agents or track spending by operational role.
4. **Delayed Threat Response:** When an agent overspends or a rogue script runs wild, treasury owners often only notice hours later after the balance is drained.

---

## 💡 The Solution

AI Treasury Agent combines:

**AI + Smart Contracts + BNB Chain**

to create a programmable treasury.

The AI continuously analyzes treasury activity and can:

- Monitor balances
- Analyze transactions
- Detect unusual activity
- Generate treasury reports
- Recommend actions
- Evaluate treasury rules
- Prepare transactions
- Execute authorized low-risk transactions

The smart contract acts as the security boundary.

It enforces:

- Spending limits
- Daily limits
- Authorized agents
- Approved recipients
- Allowed tokens
- Emergency pause
- User permissions

---

# 🧠 How It Works

```text
                    USER
                     │
                     ▼
                Web Dashboard
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
       AI Agent              Wallet
          │                     │
          │                     │
          ▼                     │
   Analyze & Decide              │
          │                     │
          ▼                     │
    Create Action               │
          │                     │
          └──────────┬──────────┘
                     ▼
             Treasury Contract
                     │
          ┌──────────┼──────────┐
          │          │          │
          ▼          ▼          ▼
       Limits     Permissions  Rules
          │          │          │
          └──────────┼──────────┘
                     ▼
                 BNB Chain
                     │
                     ▼
               Transaction
```

---

# 🔐 Core Security Model

The most important design principle is:

> **The AI never receives unrestricted control of the treasury.**

Instead, the treasury owner defines what the AI is allowed to do.

For example:

```text
Agent Permissions

Maximum transaction: $500

Daily spending limit: $2,000

Allowed token: USDT

Approved recipient:
0x123...

Agent:
0xABC...
```

If the AI tries to execute:

```text
$10,000 USDT
```

the smart contract rejects the transaction.

```text
AI requests $10,000
        │
        ▼
Treasury Contract
        │
        ▼
Maximum = $500
        │
        ▼
       ❌
     REJECT
```

This means the smart contract remains the final security layer.

---

# ⭐ Core Features

## 1. Wallet Connection

Users connect a BNB-compatible wallet to access their treasury.

The application displays:

- BNB balance
- Token balances
- Treasury value
- Transaction history
- Treasury activity

---

## 2. Programmable Treasury Vault

Users can deposit supported assets into the treasury smart contract.

The contract becomes the controlled treasury.

Example:

```text
┌────────────────────────────────────────────────────────┐
│                   Next.js Web Frontend                 │
│         Dashboard • Agent Allowances • Sandbox         │
└───────────────────────────┬────────────────────────────┘
                            │ REST / Web3
                            ▼
┌────────────────────────────────────────────────────────┐
│                  NestJS Backend API                    │
│                                                        │
│  • Auth Module (Web3 Nonce & Signature SIWE)           │
│  • Treasury Service (Live Balance & Asset Sync)        │
│  • Agent Service (Grounded LLM Chat & Insights)        │
│  • Notifications Module (Telegram Bot & In-App Feed)   │
│  • Rule Engine & Approval Workflow                     │
│  • Blockchain Service (Viem / Aevum Client)            │
└───────────────┬────────────────────────┬───────────────┘
                │                        │
       ┌────────┴────────┐      ┌────────┴────────┐
       ▼                 ▼      ▼                 ▼
  Neon PostgreSQL      Groq /   Telegram Bot   Aevum Testnet
  (Prisma ORM)        Qwen LLM  (@VaultAI1bot) (Chain ID 44005)
                                                  │
                                                  ▼
                                         AevumAgentVault.sol
                                        (tUSD8 Settlement)
```

---

## 🛠️ Technology Stack

* **Blockchain & Smart Contracts:**
  * **Network:** Aevum Testnet (QDay.io Layer 2) — Chain ID `44005`
  * **Language:** Solidity `^0.8.20`
  * **Client Library:** Viem `^2.57.16`
  * **Stablecoin:** `tUSD8` (ERC-20, 6 decimals)
  * **Native Gas:** `tQDAY` (18 decimals)
* **Backend:**
  * **Framework:** NestJS `^11.0.1` (TypeScript)
  * **ORM & Database:** Prisma `^7.9.1` with Neon PostgreSQL
  * **Authentication:** Web3 Nonce cryptographic signature challenge (EIP-191 / SIWE) + JWT
  * **Documentation:** Swagger OpenAPI `v1.4.0`
* **AI & Intelligence:**
  * **LLM Engine:** Groq SDK (`qwen/qwen3.8-27b` / `llama-3.3-70b`)
  * **Agent Framework:** Custom grounded treasury prompt engine with real-time on-chain context
* **Alerts & Integrations:**
  * **Push Notifications:** Telegram Bot API
  * **In-App Feed:** Persistent PostgreSQL event stream

---

## 📂 Project Structure

```text
AI-Treasury-Backend/
├── contracts/
│   └── src/
│       ├── AevumAgentVault.sol      # Core programmable treasury vault for Aevum
│       └── TreasuryVault.sol        # Reference contract
├── scripts/
│   ├── compile.js                   # Solc 0.8.20 compiler script (zero dependencies)
│   ├── deploy-aevum.js              # Aevum Testnet deployment & auto-config script
│   ├── setup-agent-allowance.js     # Authorize agent budgets on-chain
│   ├── simulate-agent.js            # End-to-end agent payment & security simulation
│   └── test-telegram.js             # Telegram diagnostic & chat discovery tool
├── src/
│   ├── agent/                       # LLM intelligence, insights, and recommendations
│   ├── analytics/                   # Treasury financial metrics & balance snapshots
│   ├── approvals/                   # Multi-step human-in-the-loop approval workflow
│   ├── auth/                        # Web3 wallet signature authentication
│   ├── blockchain/
│   │   ├── abis/                    # AevumAgentVault & ERC-20 ABIs & artifacts
│   │   ├── blockchain.service.ts    # Viem client configured for Aevum Testnet
│   │   └── contract.service.ts      # Multi-chain vault interaction service
│   ├── config/                      # Environment and chain configuration
│   ├── health/                      # Dynamic multi-chain & database health checks
│   ├── notifications/               # Telegram bot dispatcher & in-app alert service
│   ├── prisma/                      # Prisma database service
│   ├── rules/                       # Programmable rule evaluation engine
│   ├── transactions/                # Transaction proposal & execution tracking
│   ├── treasury/                    # Treasury vault state & overview management
│   ├── users/                       # User profile management
│   ├── wallets/                     # Multi-wallet address associations
│   ├── app.module.ts                # Root application module
│   └── main.ts                      # Entrypoint & Swagger OpenAPI configuration
├── prisma/
│   └── schema.prisma                # Database schema
├── .env.example                     # Environment configuration template
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
* **Node.js**: `v20.x` or `v22.x`
* **Package Manager**: `pnpm` (or `npm`)
* **Aevum Testnet Account**: Funded with testnet `tQDAY` gas from the [QDay Faucet](https://faucet.qday.info).

### 2. Installation
```bash
git clone https://github.com/your-username/AI-Treasury-Backend.git
cd AI-Treasury-Backend
pnpm install
```

### 3. Environment Configuration
Copy the template and configure your parameters:
```bash
cp .env.example .env
```

Ensure your `.env` contains:
```env
PORT=3750
NODE_ENV=development

# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@host/neondb?sslmode=verify-full&channel_binding=require"
DIRECT_URL="postgresql://user:password@host/neondb?sslmode=verify-full&channel_binding=require"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN=7d

# Aevum Testnet Configuration
BLOCKCHAIN_NETWORK=aevum-testnet
AEVUM_CHAIN_ID=44005
AEVUM_RPC_URL=https://rpc-test.qday.info
TUSD8_TOKEN_ADDRESS=0x456569838f1d43009A91ebA4263147Afd7233483
TREASURY_CONTRACT_ADDRESS=0x13487df8c92df39e8f71f86fc2da9873dbbd68aa
AEVUM_PLATFORM_PRIVATE_KEY=your_private_key_here
BLOCKCHAIN_EXPLORER_URL=https://explorer-test.qday.info

# Telegram Notifications
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_CHAT_ID=your_chat_id_or_channel_username

# AI Provider (Groq / Qwen / Llama)
AI_API_KEY=your_groq_api_key
AI_MODEL=qwen/qwen3.8-27b
```

### 4. Database Setup & Build
```bash
# Generate Prisma Client & Build TypeScript
npm run build
```

---

# 🤖 AI Agent Execution Modes

The system supports three levels of automation.

## Mode 1 — Recommend

The AI only recommends an action.

```text
AI
 ↓
Recommendation
 ↓
User decides
```

Example:

> "I recommend moving $500 USDT to your reserve wallet."

---

## Mode 2 — Approval Required

The AI prepares a transaction.

```text
AI
 ↓
Prepare transaction
 ↓
User approves
 ↓
Smart contract
 ↓
BNB Chain
```

This is useful for larger or sensitive transactions.

---

## Mode 3 — Automated

The AI can execute predefined low-risk actions.

```text
AI
 ↓
Check rule
 ↓
Check permissions
 ↓
Check limits
 ↓
Smart contract
 ↓
Execute
```

Example:

> Automatically transfer $100 USDT to the approved reserve wallet every Friday.

---

# 🛡️ Smart Contract Security Controls

The treasury contract should enforce:

### Agent authorization

Only approved AI agents can request automated actions.

### Transaction limits

Maximum amount allowed per transaction.

### Daily limits

Maximum amount the agent can move per day.

### Token allowlist

Only approved tokens can be transferred.

### Recipient allowlist

The agent can only send funds to approved addresses.

### Emergency pause

The treasury owner can stop automated transactions.

### Ownership control

Only the treasury owner can modify critical permissions.

---

# 🧩 Example

Imagine a company has:

```text
$20,000 USDT
```

The owner configures:

```text
Transaction limit: $500

Daily limit: $2,000

Approved reserve wallet:
0x123...

Agent:
0x456...
```

The AI notices that the company has excess operating funds.

It recommends:

> "Move $500 USDT to the reserve wallet."

The smart contract checks:

```text
Agent authorized?       ✅

Amount <= $500?         ✅

Recipient approved?     ✅

Daily limit available?  ✅

Token allowed?          ✅
```

The transaction executes.

---

# 🏗️ System Architecture

```text
┌──────────────────────────────────────┐
│             Frontend                 │
│              Next.js                 │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│             Backend                  │
│              NestJS                  │
├──────────────────────────────────────┤
│                                      │
│  AI Agent Service                    │
│  Treasury Service                    │
│  Transaction Monitor                │
│  Rule Engine                         │
│  Analytics Service                   │
│                                      │
└───────────────┬──────────────────────┘
                │
       ┌────────┴────────┐
       │                 │
       ▼                 ▼
 PostgreSQL           AI Provider
       │
       │
       ▼
┌──────────────────────────────────────┐
│          BNB Smart Chain             │
│                                      │
│        TreasuryVault.sol             │
└──────────────────────────────────────┘
```

---

# 🛠️ Technology Stack

## Frontend

- Next.js
- TypeScript
- Tailwind CSS
- wagmi
- viem

## Backend

- NestJS
- TypeScript
- Prisma
- PostgreSQL
- Redis

## AI

- LLM API
- AI Agent Service
- Rule Evaluation Engine

## Blockchain

- BNB Smart Chain
- Solidity
- OpenZeppelin
- viem

## Smart Contract

```text
TreasuryVault.sol
```

---

# 📂 Project Structure

```text
ai-treasury-agent/
│
├── apps/
│   │
│   ├── web/
│   │   ├── app/
│   │   │   ├── dashboard/
│   │   │   ├── treasury/
│   │   │   ├── transactions/
│   │   │   ├── rules/
│   │   │   ├── agent/
│   │   │   └── settings/
│   │   │
│   │   ├── components/
│   │   │   ├── treasury/
│   │   │   ├── agent/
│   │   │   ├── transactions/
│   │   │   └── wallet/
│   │   │
│   │   ├── lib/
│   │   │   ├── web3/
│   │   │   └── api/
│   │   │
│   │   └── package.json
│   │
│   └── api/
│       ├── src/
│       │   │
│       │   ├── auth/
│       │   │
│       │   ├── users/
│       │   │
│       │   ├── treasury/
│       │   │
│       │   ├── transactions/
│       │   │
│       │   ├── agent/
│       │   │   ├── agent.service.ts
│       │   │   ├── agent.controller.ts
│       │   │   ├── agent.module.ts
│       │   │   └── prompts/
│       │   │
│       │   ├── rules/
│       │   │   ├── rules.service.ts
│       │   │   ├── rules.controller.ts
│       │   │   └── rules.engine.ts
│       │   │
│       │   ├── monitoring/
│       │   │
│       │   ├── blockchain/
│       │   │   ├── blockchain.service.ts
│       │   │   └── bnb.service.ts
│       │   │
│       │   ├── notifications/
│       │   │
│       │   ├── prisma/
│       │   │
│       │   └── main.ts
│       │
│       └── package.json
│
├── contracts/
│   │
│   ├── src/
│   │   ├── TreasuryVault.sol
│   │   ├── interfaces/
│   │   ├── libraries/
│   │   └── mocks/
│   │
│   ├── test/
│   │   └── TreasuryVault.t.sol
│   │
│   ├── script/
│   │   └── Deploy.s.sol
│   │
│   ├── foundry.toml
│   └── README.md
│
├── packages/
│   ├── shared/
│   ├── types/
│   └── config/
│
├── docs/
│   ├── architecture.md
│   ├── smart-contract.md
│   ├── agent.md
│   └── security.md
│
├── .env.example
├── docker-compose.yml
├── package.json
└── README.md
```

---

# 🔄 Example Transaction Flow

```text
1. User creates treasury
          ↓
2. User deposits USDT
          ↓
3. Treasury contract holds funds
          ↓
4. Backend monitors activity
          ↓
5. AI analyzes activity
          ↓
6. AI identifies an opportunity
          ↓
7. AI creates recommendation
          ↓
8. User approves OR automation rule applies
          ↓
9. Treasury contract validates request
          ↓
10. BNB Chain executes transaction
          ↓
11. Transaction is recorded
          ↓
12. AI updates treasury analysis
```

---

# 🧪 Example AI Interaction

### User

> How is my treasury doing?

### AI

> Your treasury currently holds approximately $17,000. Your recent spending is within normal levels. However, 70% of your assets are held in USDT.

---

### User

> Show unusual transactions.

### AI

> I found one transaction that requires attention. A $5,000 outgoing transaction is significantly larger than your recent average of $350.

---

### User

> What should I do?

### AI

> I recommend reviewing the transaction before making additional automated payments.

---

### User

> Move $200 to my reserve wallet.

### AI

> The transaction is within your configured $500 transaction limit and the destination is an approved wallet.

> **Approve transaction**

---

# 🏆 Why BNB Chain?

BNB Chain provides the on-chain execution layer for the treasury.

The smart contract gives the treasury:

- Transparent rules
- Programmable permissions
- On-chain execution
- Verifiable transactions
- Automated treasury operations

The project demonstrates how AI can interact with blockchain infrastructure without giving the AI unrestricted custody of user funds.

---

## 🎯 DoraHacks Submission Deliverables Checklist

- [x] **Smart Contract:** [`AevumAgentVault.sol`](contracts/src/AevumAgentVault.sol) deployed on Aevum Testnet at [`0x13487df8c92df39e8f71f86fc2da9873dbbd68aa`](https://explorer-test.qday.info/address/0x13487df8c92df39e8f71f86fc2da9873dbbd68aa).
- [x] **Stablecoin Integration:** Integrated official `tUSD8` token [`0x456569838f1d43009A91ebA4263147Afd7233483`](https://explorer-test.qday.info/token/0x456569838f1d43009A91ebA4263147Afd7233483).
- [x] **End-to-End Flow:** Automated simulation script ([`scripts/simulate-agent.js`](scripts/simulate-agent.js)) executing micro-payments and verifying on-chain security containment.
- [x] **Verified Source Code:** Open-source repository with full compilation, deployment, and testing toolchain.
- [x] **Live API & Documentation:** Full OpenAPI Swagger documentation deployed and accessible.
- [x] **Multi-Channel Alerting:** Real-time push notifications via Telegram Bot ([@VaultAI1bot](https://t.me/VaultAI1bot)).

---

## 📜 License

MIT