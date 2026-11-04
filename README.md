🤖 AI Treasury Agent
An AI-powered programmable treasury that monitors blockchain activity, detects risks,
recommends actions, and executes authorized transactions through a secure smart
contract on BNB Chain.
🚀 Overview
Managing a crypto treasury can be difficult.
Businesses, DAOs, startups, and Web3 projects need to constantly monitor:
Wallet balances
Incoming and outgoing transactions
Spending patterns
Treasury reserves
Suspicious transactions
Recurring payments
Operational expenses
Today, much of this is done manually.
AI Treasury Agent provides an intelligent assistant that monitors a user's treasury, understands its activity,
detects unusual behavior, and recommends or executes actions according to rules defined by the treasury
owner.
The important part is that the AI does not have unlimited access to the treasury.
Instead:
AI makes decisions and recommendations.
The smart contract enforces permissions and limits.
BNB Chain executes the transaction.
🎯 Problem
Managing an on-chain treasury manually creates several problems.
•
•
•
•
•
•
•
1
1. Constant monitoring
Treasury owners have to repeatedly check their wallets and transactions.
2. Difficult transaction analysis
A wallet may contain hundreds or thousands of transactions, making it difficult to understand spendingpatterns.
3. Unusual transactions can be missed
A large or unexpected transaction may go unnoticed.
4. Manual treasury operations
Recurring transfers, reserve management, and other treasury operations require manual action.
5. AI systems can be dangerous if given unrestricted wallet access
Giving an AI agent a private key or unlimited spending permission creates a major security risk.
💡 Solution
AI Treasury Agent combines:
AI + Smart Contracts + BNB Chain
to create a programmable treasury.
The AI continuously analyzes treasury activity and can:
Monitor balances
Analyze transactions
Detect unusual activity
Generate treasury reports
Recommend actions
Evaluate treasury rules
Prepare transactions
Execute authorized low-risk transactions
The smart contract acts as the security boundary.
It enforces:
Spending limits
•
•
•
•
•
•
•
•
•
2
Daily limits
Authorized agents
Approved recipients
Allowed tokens
Emergency pause
User permissions
🧠 How It Works
USER
│
▼
Web Dashboard
│
┌──────────┴──────────┐
│ │
▼ ▼
AI Agent Wallet
│ │
│ │
▼ │
Analyze & Decide │
│ │
▼ │
Create Action │
│ │
└──────────┬──────────┘
▼
Treasury Contract
│
┌──────────┼──────────┐
│ │ │
▼ ▼ ▼
Limits Permissions Rules
│ │ │
└──────────┼──────────┘
▼
BNB Chain
│
▼
Transaction
•
•
•
•
•
•
3
🔐 Core Security Model
The most important design principle is:
The AI never receives unrestricted control of the treasury.
Instead, the treasury owner defines what the AI is allowed to do.
For example:
Agent Permissions
Maximum transaction: $500
Daily spending limit: $2,000
Allowed token: USDT
Approved recipient:
0x123...
Agent:
0xABC...
If the AI tries to execute:
$10,000 USDT
the smart contract rejects the transaction.
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
4
This means the smart contract remains the final security layer.
⭐ Core Features
1. Wallet Connection
Users connect a BNB-compatible wallet to access their treasury.
The application displays:
BNB balance
Token balances
Treasury value
Transaction history
Treasury activity
2. Programmable Treasury Vault
Users can deposit supported assets into the treasury smart contract.
The contract becomes the controlled treasury.
Example:
Treasury
BNB $2,000
USDT $10,000
USDC $5,000
----------------
Total $17,000
3. AI Treasury Agent
The AI analyzes treasury activity.
Users can ask:
"How is my treasury doing?"
•
•
•
•
•
5
"Show me unusual transactions."
"How much did we spend this month?"
"What are my biggest expenses?"
"What should I do with my excess funds?"
The AI responds using the treasury's actual data.
4. Transaction Monitoring
The system monitors treasury transactions.
For example:
Incoming
+ $2,000 USDT
Outgoing
- $400 USDT
Outgoing
- $7,500 USDT
The AI can identify that the $7,500 transaction is significantly larger than normal activity.
5. AI Anomaly Detection
The AI looks for unusual treasury behavior.
Example:
Normal transactions:
$100
$250
$400
$300
New transaction:
6
$8,000
The agent could report:
⚠️ An unusual transaction of $8,000 was detected. This is significantly larger than your recent
transaction pattern.
The AI does not automatically claim that the transaction is fraudulent.
It simply flags it for review.
6. Treasury Rules
Users can create rules.
Example:
IF
Treasury balance < $2,000
THEN
Notify treasury owner
Another:
IF
Transaction > $1,000
THEN
Require manual approval
Another:
EVERY FRIDAY
Transfer $100 USDT
7
TO
Approved reserve wallet
🤖 AI Agent Execution Modes
The system supports three levels of automation.
Mode 1 — Recommend
The AI only recommends an action.
AI
↓
Recommendation
↓
User decides
Example:
"I recommend moving $500 USDT to your reserve wallet."
Mode 2 — Approval Required
The AI prepares a transaction.
AI
↓
Prepare transaction
↓
User approves
↓
Smart contract
↓
BNB Chain
This is useful for larger or sensitive transactions.
8
Mode 3 — Automated
The AI can execute predefined low-risk actions.
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
Example:
Automatically transfer $100 USDT to the approved reserve wallet every Friday.
🛡️ Smart Contract Security Controls
The treasury contract should enforce:
Agent authorization
Only approved AI agents can request automated actions.
Transaction limits
Maximum amount allowed per transaction.
Daily limits
Maximum amount the agent can move per day.
Token allowlist
Only approved tokens can be transferred.
Recipient allowlist
The agent can only send funds to approved addresses.
9
Emergency pause
The treasury owner can stop automated transactions.
Ownership control
Only the treasury owner can modify critical permissions.
🧩 Example
Imagine a company has:
$20,000 USDT
The owner configures:
Transaction limit: $500
Daily limit: $2,000
Approved reserve wallet:
0x123...
Agent:
0x456...
The AI notices that the company has excess operating funds.
It recommends:
"Move $500 USDT to the reserve wallet."
The smart contract checks:
Agent authorized? ✅
Amount <= $500? ✅
Recipient approved? ✅
Daily limit available? ✅
10
Token allowed? ✅
The transaction executes.
🏗️ System Architecture
┌──────────────────────────────────────┐
│ Frontend │
│ Next.js │
└──────────────────┬───────────────────┘
│
▼
┌──────────────────────────────────────┐
│ Backend │
│ NestJS │
├──────────────────────────────────────┤
│ │
│ AI Agent Service │
│ Treasury Service │
│ Transaction Monitor │
│ Rule Engine │
│ Analytics Service │
│ │
└───────────────┬──────────────────────┘
│
┌────────┴────────┐
│ │
▼ ▼
PostgreSQL AI Provider
│
│
▼
┌──────────────────────────────────────┐
│ BNB Smart Chain │
│ │
│ TreasuryVault.sol │
└──────────────────────────────────────┘
11
🛠️ Technology Stack
Frontend
Next.js
TypeScript
Tailwind CSS
wagmi
viem
Backend
NestJS
TypeScript
Prisma
PostgreSQL
Redis
AI
LLM API
AI Agent Service
Rule Evaluation Engine
Blockchain
BNB Smart Chain
Solidity
OpenZeppelin
viem
Smart Contract
TreasuryVault.sol
📂 Project Structure
ai-treasury-agent/
│
├── apps/
│ │
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
12
│ ├── web/
│ │ ├── app/
│ │ │ ├── dashboard/
│ │ │ ├── treasury/
│ │ │ ├── transactions/
│ │ │ ├── rules/
│ │ │ ├── agent/
│ │ │ └── settings/
│ │ │
│ │ ├── components/
│ │ │ ├── treasury/
│ │ │ ├── agent/
│ │ │ ├── transactions/
│ │ │ └── wallet/
│ │ │
│ │ ├── lib/
│ │ │ ├── web3/
│ │ │ └── api/
│ │ │
│ │ └── package.json
│ │
│ └── api/
│ ├── src/
│ │ │
│ │ ├── auth/
│ │ │
│ │ ├── users/
│ │ │
│ │ ├── treasury/
│ │ │
│ │ ├── transactions/
│ │ │
│ │ ├── agent/
│ │ │ ├── agent.service.ts
│ │ │ ├── agent.controller.ts
│ │ │ ├── agent.module.ts
│ │ │ └── prompts/
│ │ │
│ │ ├── rules/
│ │ │ ├── rules.service.ts
│ │ │ ├── rules.controller.ts
│ │ │ └── rules.engine.ts
│ │ │
│ │ ├── monitoring/
│ │ │
│ │ ├── blockchain/
13
│ │ │ ├── blockchain.service.ts
│ │ │ └── bnb.service.ts
│ │ │
│ │ ├── notifications/
│ │ │
│ │ ├── prisma/
│ │ │
│ │ └── main.ts
│ │
│ └── package.json
│
├── contracts/
│ │
│ ├── src/
│ │ ├── TreasuryVault.sol
│ │ ├── interfaces/
│ │ ├── libraries/
│ │ └── mocks/
│ │
│ ├── test/
│ │ └── TreasuryVault.t.sol
│ │
│ ├── script/
│ │ └── Deploy.s.sol
│ │
│ ├── foundry.toml
│ └── README.md
│
├── packages/
│ ├── shared/
│ ├── types/
│ └── config/
│
├── docs/
│ ├── architecture.md
│ ├── smart-contract.md
│ ├── agent.md
│ └── security.md
│
├── .env.example
├── docker-compose.yml
├── package.json
└── README.md
14
🔄 Example Transaction Flow
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
🧪 Example AI Interaction
User
How is my treasury doing?
AI
Your treasury currently holds approximately $17,000. Your recent spending is within normal
levels. However, 70% of your assets are held in USDT.
User
Show unusual transactions.
15
AI
I found one transaction that requires attention. A $5,000 outgoing transaction is significantlylarger than your recent average of $350.
User
What should I do?
AI
I recommend reviewing the transaction before making additional automated payments.
User
Move $200 to my reserve wallet.
AI
The transaction is within your configured $500 transaction limit and the destination is anapproved wallet.
Approve transaction
🏆 Why BNB Chain?
BNB Chain provides the on-chain execution layer for the treasury.
The smart contract gives the treasury:
Transparent rules
Programmable permissions
On-chain execution
Verifiable transactions
Automated treasury operations
The project demonstrates how AI can interact with blockchain infrastructure without giving the AIunrestricted custody of user funds.
•
•
•
•
•
16
🎯 Hackathon Value Proposition
The project demonstrates three technologies working together:
AI
Understands treasury activity and makes intelligent recommendations.
Smart Contracts
Enforce treasury policies and spending limits.
BNB Chain
Provides the execution and settlement layer.
The result is:
An intelligent, programmable, and policy-controlled on-chain treasury.
🔮 Future Development
Future versions could support:
Multi-signature treasury management
DAO treasury management
Payroll automation
Recurring payments
Multi-wallet treasury
Telegram/Discord alerts
Advanced risk scoring
Treasury forecasting
Cross-chain treasury management
AI-generated financial reports
DeFi strategy recommendations
⚠️ Security
This project is designed around the principle of least privilege.
The AI agent should never have unrestricted access to treasury funds.
•
•
•
•
•
•
•
•
•
•
•
17
All automated actions must be constrained by smart-contract permissions and spending limits.
The smart contract should be thoroughly tested and independently audited before being used with
significant real funds.
📜 License
MIT
18