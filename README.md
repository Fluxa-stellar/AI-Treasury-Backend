# 🤖 AI Treasury Agent (Aevum Network)

> **An AI-powered, programmable stablecoin treasury and allowance vault built on the Aevum Testnet (official Layer 2 for QDay.io) for the autonomous agentic economy using `tUSD8`.**

---

## 🌐 Live Deployments & Network Details

| Parameter | Value |
| :--- | :--- |
| **Network** | **Aevum Testnet (QDay.io L2)** |
| **Chain ID** | `44005` (Hex: `0xaba5`) |
| **RPC Endpoint** | `https://rpc-test.qday.info` |
| **Block Explorer** | [https://explorer-test.qday.info](https://explorer-test.qday.info) |
| **Native Gas Token** | `tQDAY` (18 decimals) |
| **Primary Stablecoin (`tUSD8`)** | [`0x456569838f1d43009A91ebA4263147Afd7233483`](https://explorer-test.qday.info/token/0x456569838f1d43009A91ebA4263147Afd7233483) (6 decimals) |
| **Deployed Vault Contract** | [`0x13487df8c92df39e8f71f86fc2da9873dbbd68aa`](https://explorer-test.qday.info/address/0x13487df8c92df39e8f71f86fc2da9873dbbd68aa) |
| **Interactive Swagger Docs** | [https://ai-treasury-backend.onrender.com/api/docs](https://ai-treasury-backend.onrender.com/api/docs) *(or `/api/docs` locally)* |
| **Official Telegram Bot** | [@VaultAI1bot](https://t.me/VaultAI1bot) |
| **Event** | **DoraHacks — Aevum Builder Challenge #1** |

---

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

AI Treasury Agent bridges **Autonomous AI Agents**, **Smart Contract Safety Boundaries**, and **Aevum Testnet L2** to create a programmable, policy-governed treasury.

* **On-Chain Policy Firewall:** Programmatic spending allowances are enforced by immutable smart contract logic on Aevum L2, not by trusting backend code.
* **Stablecoin Settlement with `tUSD8`:** Predictable, low-cost operational accounting using the official Aevum testnet stablecoin.
* **Per-Agent Multi-Allowance Architecture:** Each AI agent has an isolated spending budget, single-tx ceiling, and optional destination whitelist.
* **Multi-Channel Alerting:** Instant push notifications via Telegram Bot (`@VaultAI1bot`) and persistent in-app insight feeds whenever payments settle or boundaries are breached.
* **Grounded AI Treasury Assistant:** A context-aware conversational AI assistant powered by LLM inference with real-time balance grounding and anomaly detection.

---

## 🔐 Core Security Model (`AevumAgentVault.sol`)

The cornerstone rule of the platform:

> **The AI never receives custody or unrestricted control of the treasury.**

```text
Autonomous Agent requests 5,000 tUSD8
                 │
                 ▼
     AevumAgentVault Smart Contract
                 │
                 ▼
       Checks on-chain bounds:
       • Is Agent Authorized?              ✅
       • Amount <= Max Single Tx ($25)?    ❌ (5,000 > 25)
       • Amount <= Remaining Daily ($100)? ❌ (5,000 > 100)
                 │
                 ▼
        🛡️ ON-CHAIN REVERT
   (Funds remain 100% safe in Vault)
                 │
                 ▼
  🚨 Instant Telegram Alert Dispatched
```

### Smart Contract Invariants:
* **Per-Agent Quota Limits:** Individual periodic spending limits (`periodSpendingLimit`) preventing one agent from consuming another's budget.
* **Single-Transaction Ceilings:** Strict maximum transaction amount (`maxTxAmount`) to block sudden drain attempts.
* **Rolling Reset Windows:** 24-hour rolling time windows (`periodDuration`) with automatic on-chain budget resets.
* **Recipient Whitelisting:** Optional per-agent approved recipient mappings (`agentApprovedRecipients`) ensuring funds only flow to verified service providers.
* **Emergency Pause:** One-click kill switch for the vault owner to halt all automated agent transfers.
* **Checks-Effects-Interactions:** Full protection against reentrancy attacks.

---

## ⭐ Key Features

### 1. Autonomous Agent Allowance Management
* View all authorized AI agents with dedicated wallet addresses and operational roles.
* Real-time allowance fuel gauges displaying used vs. remaining `tUSD8` budget.
* Reset countdown timers tracking the active 24-hour spending period.

### 2. Multi-Tier Execution Architecture
* **Tier 1 — Autonomous Micro-Payments:** Agents autonomously settle verified expenses under the single-tx ceiling (e.g. paying 2.50 `tUSD8` for inference API compute).
* **Tier 2 — Human-in-the-Loop Approvals:** Transfers exceeding daily limits or involving non-whitelisted recipients generate approval proposals requiring owner sign-off.
* **Tier 3 — AI Strategic Recommendations:** The AI analyzes historical inflows/outflows and suggests treasury reallocations or reserve adjustments.

### 3. Real-Time Push Notifications & Telegram Bot
* Connected to **[@VaultAI1bot](https://t.me/VaultAI1bot)**.
* **Disbursement Alerts:** Instant message with transaction hash, agent name, recipient, memo, and direct Aevum explorer link.
* **Security Containment Alerts:** Urgent ping when the smart contract blocks an unauthorized or over-budget transaction.
* **Budget Warnings:** Threshold alerts triggered when an agent reaches 80%+ of its daily allowance.
* **In-App Insights:** Dual delivery persists alerts in PostgreSQL (`AgentInsight`) for instant UI display.

### 4. Interactive Agent Simulation Sandbox
* Standalone script (`scripts/simulate-agent.js`) demonstrating the complete end-to-end flow:
  1. Reads live agent allowance from `AevumAgentVault`.
  2. Executes a valid micro-disbursement of 2.50 `tUSD8`.
  3. Simulates an unauthorized 5,000 `tUSD8` request and catches the on-chain revert.
  4. Dispatches live notifications to Telegram.

---

## 🏗️ System Architecture

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

## 🧪 Testing & Verification Scripts

The repository includes a suite of standalone diagnostic and execution scripts:

### 1. Compile the Smart Contract
Compiles [`AevumAgentVault.sol`](contracts/src/AevumAgentVault.sol) using the official `solc 0.8.20` compiler and writes artifacts to `src/blockchain/abis/`:
```bash
node scripts/compile.js
```

### 2. Deploy to Aevum Testnet
Deploys the vault, links `tUSD8`, verifies on-chain receipt, and automatically updates `.env`:
```bash
node scripts/deploy-aevum.js
```

### 3. Configure Agent Allowances
Sets a daily allowance (e.g. 100 `tUSD8`) and max single-tx cap (e.g. 25 `tUSD8`) for an agent wallet:
```bash
node scripts/setup-agent-allowance.js <OPTIONAL_AGENT_ADDRESS>
```

### 4. Run the End-to-End Agent Simulator
Simulates real autonomous agent behavior on Aevum Testnet:
* Queries live on-chain allowances.
* Settles a valid micro-disbursement of 2.50 `tUSD8`.
* Attempts an unauthorized 5,000 `tUSD8` spend to verify smart-contract containment.
* Triggers real-time alerts to Telegram.
```bash
node scripts/simulate-agent.js
```

### 5. Telegram Diagnostic Tool
Verifies your bot connection, discovers your `chat_id`, and sends a verification test alert:
```bash
node scripts/test-telegram.js
```

---

## 📚 API Documentation (Swagger)

The backend provides an interactive OpenAPI Swagger interface documenting all 11 API controllers:

* **Local:** `http://localhost:3750/api/docs`
* **Production:** `https://ai-treasury-backend.onrender.com/api/docs`

### Key Endpoint Groups:
* `POST /api/auth/nonce` — Generate Web3 login nonce.
* `POST /api/auth/verify` — Verify cryptographic signature and issue JWT.
* `GET /api/treasury/:id/overview` — Fetch real-time on-chain balances (`tQDAY` and `tUSD8`) and active agent allowances.
* `POST /api/agent/chat` — Conversational AI assistant with real-time treasury context.
* `GET /api/agent/:treasuryId/insights` — Query AI-generated treasury insights and in-app alerts.
* `POST /api/notifications/test-telegram` — Trigger a test alert to the Telegram channel.
* `GET /api/health` — Real-time health check reporting Neon DB and Aevum Testnet block height.

---

## 🏆 Why Aevum Network & QDay.io?

Aevum is the official testnet for **QDay.io**, a post-quantum, EVM-compatible Layer 2 infrastructure network built on the Abelian blockchain:

1. **Post-Quantum Security:** Protects treasuries, contracts, and settlement layers against emerging quantum compute vulnerabilities.
2. **Built for the Agentic Economy:** Engineered for autonomous, high-frequency Web3 agent interactions with sub-second finality and predictable gas.
3. **Native Stablecoin Foundation:** Using `tUSD8` as a standardized payment medium provides predictable operational budgeting for AI agent compute and task execution.

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

This project is licensed under the [MIT License](LICENSE).
