<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/stellar-agentic--framework-7B3FE4?style=for-the-badge&logo=stellar&logoColor=white&labelColor=1a1a2e">
  <img alt="Stellar Forge" src="https://img.shields.io/badge/stellar-agentic--framework-7B3FE4?style=for-the-badge&logo=stellar&logoColor=white&labelColor=ffffff">
</picture>

[![npm](https://img.shields.io/npm/v/create-stellar-agentic?color=cb3837&logo=npm&label=cli)](https://www.npmjs.com/package/create-stellar-agentic)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![GitHub](https://img.shields.io/badge/repo-7B3FE4?logo=github)](https://github.com/rylsherdamz-rgb/stellar-forge)
[![Built for Stellar](https://img.shields.io/badge/built%20for-Stellar-000000?logo=stellar)](https://stellar.org)

---

**Build production Stellar dApps in minutes.** An eval-driven, multi-agent coding harness that routes your request to 6 parallel specialist agents, verifies every output against structured evals, steers on failure, and produces a ship-ready eval report. Includes Stellar Agentic Kit hooks for blockchain queries and MCP integrations for chain-level debugging.

```bash
# Scaffold a full dApp (works anywhere — no editor required)
npx create-stellar-agentic my-dapp --yes

# Or install the multi-agent skill for Claude Code / Cursor / Copilot
npx skills add rylsherdamz-rgb/stellar-forge --agent claude-code
```

---

## Features

| | |
|---|---|
| **🧠 6 Specialist Agents** | Parallel execution for contracts, frontend, backend, payments, ops, and ZK |
| **✅ Eval-Driven Quality** | Structured pass/fail criteria, max 3 retries, pass@k metrics |
| **🔗 Stellar Agentic Kit** | `useStellarData()`, `useContract()`, `useStellarWallet()` — no raw RPC |
| **🎨 Frontend Design Skill** | Tailwind CSS-first Stellar dApp UI — wallet UX, 4-phase tx flows, dark mode |
| **🚀 Auto-Deploy Contracts** | Test gate (`cargo test` must pass) → deploy → record ID to `.env` + tracker |
| **⚡ MCP Integrations** | Stellar RPC, filesystem, GitHub, Playwright — direct from Claude |
| **📦 One-Command Scaffold** | `npx create-stellar-agentic` — full dApp in seconds |
| **📊 Knowledge Graphs** | Auto-graphify every project — architecture navigation, query, explain |
| **🧩 10 Bundled Skills** | smart-contracts, dapp, data, assets, agentic-payments, standards, zk-proofs, stellar-mcp, frontend-design, graphify |
| **🔄 Stateful Memory** | per-project context, ADR decision log, session activity logs |

---

## Quick Start

### Scaffold a project (recommended)

```bash
npx create-stellar-agentic my-stellar-dapp --yes
cd my-stellar-dapp
npm install
```

Prefer a global install?

```bash
npm install -g create-stellar-agentic
create-stellar-agentic my-dapp --yes
```

This scaffolds a complete project with:
- SEP-41 token contract (`contracts/token/`) — auto-deployed on first testnet deploy
- Next.js frontend with Stellar Wallets Kit + Tailwind CSS (`frontend/`)
- Express backend with x402 middleware (`backend/`)
- Agentic Kit hooks (`useStellarData`, `useContract`, `useWallet`) pre-installed
- CI/CD workflows (`.github/`)
- Deploy tracker (`data/deployments/`) + deploy script (`scripts/deploy-contract.sh`)

### As an AI Coding Agent Skill (Claude Code, Cursor, Copilot)

```bash
npx skills add rylsherdamz-rgb/stellar-forge --agent claude-code
```

Then in any Claude Code session, just say:

> _"Build a token contract with a React frontend and x402 payments"_

The harness routes your request to the right agents, builds everything, verifies with evals, and reports results.

---

## Architecture

```
                          ┌─────────────────────────────┐
                          │    User Request              │
                          │  "Build a DeFi dApp"         │
                          └──────────────┬──────────────┘
                                         │
                          ┌──────────────▼──────────────┐
                          │    CLAUDE.md (Kernel)       │
                          │    Route → Track → Report    │
                          └──────────────┬──────────────┘
                                         │
               ┌─────────────────────────┼─────────────────────────┐
               │                         │                         │
     ┌─────────▼─────────┐    ┌──────────▼──────────┐   ┌─────────▼─────────┐
     │  @stellar-contracts│    │  @stellar-frontend  │   │  @stellar-backend │
     │  Rust + soroban-sdk│    │  Next.js + Kit      │   │  Express + RPC    │
     └─────────┬─────────┘    └──────────┬──────────┘   └─────────┬─────────┘
               │                         │                         │
     ┌─────────▼─────────┐    ┌──────────▼──────────┐   ┌─────────▼─────────┐
     │  @stellar-payments │    │  @stellar-ops       │   │  @stellar-zk      │
     │  x402 + MPP        │    │  CI/CD + Deploy     │   │  Groth16 + Noir   │
     └───────────────────┘    └─────────────────────┘   └───────────────────┘
               │                         │                         │
               └─────────────┬───────────┴───────────┬─────────────┘
                             │                       │
                    ┌────────▼────────┐      ┌───────▼────────┐
                    │  Verify & Steer │      │  E2E Test      │
                    │  (evals/*)      │      │  (Playwright)  │
                    └────────┬────────┘      └───────┬────────┘
                             │                       │
                    ┌────────▼────────────────────────▼────────┐
                    │           Eval Report                     │
                    │  CONTRACT: 5/5  FRONTEND: 4/4            │
                    │  BACKEND: 3/3   E2E: 2/2                 │
                    │  Overall: SHIP IT ✓                       │
                    └───────────────────────────────────────────┘
```

---

## Installation

### Method 1: npx (no install)

```bash
npx create-stellar-agentic my-dapp --yes
```

### Method 2: npm Global

```bash
npm install -g create-stellar-agentic
create-stellar-agentic my-dapp --yes
# or: stellar-forge my-dapp --yes
```

### Method 3: AI Agent Skill (Claude Code, Cursor, Copilot)

```bash
# Register for Claude Code (recommended)
npx skills add rylsherdamz-rgb/stellar-forge --agent claude-code

# Or for Cursor
npx skills add rylsherdamz-rgb/stellar-forge --agent cursor
```

All 10 dependency skills auto-install to `~/.claude/skills/`.

### Method 4: Clone + Install

```bash
git clone https://github.com/rylsherdamz-rgb/stellar-forge.git
cd stellar-forge
npx skills add ./ --agent claude-code
```

### Skill-Only (no templates, just the skill)

```bash
npx create-stellar-agentic --skill-only .
```

---

## Usage

### Phase 1 — Intent Capture

Tell the harness what you're building. It maps keywords to eval templates:

| Request | Agents Spawned | Evals Used |
|---------|---------------|------------|
| _"Token contract"_ | @stellar-contracts | contract + asset |
| _"DeFi lending platform"_ | @stellar-contracts + @stellar-backend | contract + backend |
| _"Paid API with x402"_ | @stellar-payments | agentic-payments + e2e |
| _"NFT marketplace"_ | @stellar-contracts + @stellar-frontend | contract + frontend |
| _"Wallet connect page"_ | @stellar-frontend | frontend |
| _"ZK private voting"_ | @stellar-contracts + @stellar-zk | contract + zk |
| _"Full dApp"_ | All 6 agents | all evals |

### Phase 2 — Spawn Agents

The kernel routes sub-tasks to specialist agents in parallel. Each agent loads its skill context and template code.

### Phase 3 — Verify & Steer

Every agent output is checked against its eval criteria. Failed checks → corrective context → retry (max 3).

```
EVAL: 01-contract-eval
  Check: Compiles to WASM → PASS
  Check: All unit tests pass → FAIL (attempt 1/3)
  Check: Auth on privileged functions → PASS
  Result: 2/3 passed — steering contract agent...
```

### Phase 4 — E2E Test

1. Start local Stellar network (via `stellar quickstart`)
2. Deploy contracts
3. Run Playwright browser tests against the frontend
4. Run x402 payment flow tests
5. Graphify the project

### Phase 5 — Report

```
STELLAR CODING HARNESS :: EVAL REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Project: my-dapp
CONTRACT EVALS:     5/5 passed
FRONTEND EVALS:     4/4 passed
BACKEND EVALS:      3/3 passed
PAYMENT EVALS:      2/2 passed
E2E EVALS:          2/2 passed
GRAPH HEALTH:       142 nodes, 387 edges
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Overall:            SHIP IT ✓
```

---

## Stellar Agentic Kit

All blockchain queries go through typed hooks — never raw RPC or curl.

```tsx
import { useWallet, useContract } from "@/providers/wallet-provider";

function TokenBalance({ contractId }: { contractId: string }) {
  const { address, getBalances } = useWallet();
  const { read } = useContract(contractId);
  // read() = simulation only, zero fees, no wallet prompt
  // write() = full sim + assemble + sign + submit + confirm
}
```

### Available Hooks

| Hook | Import | Purpose |
|------|--------|---------|
| `useStellarData()` | `@/hooks/use-stellar-data` | `getBalances`, `queryContract`, `getContractData`, `getEvents`, `getTransaction` |
| `useContract(id)` | `@/hooks/use-contract` | `read()` (simulation), `write()` (sign+submit) |
| `useStellarWallet()` | `@/hooks/use-stellar-wallet` | `connect`, `disconnect`, `sign`, `getBalances` |
| `useWallet()` | `@/providers/wallet-provider` | Context — same as `useStellarWallet()` |

### Strict Rules

- **All blockchain queries**: use `useStellarData()` — no `fetch()`, no `curl`, no raw RPC
- **Read-only state**: use `useContract().read()` — simulation, zero fees
- **State-changing calls**: use `useContract().write()` — handles sim + assemble + sign + submit + confirm
- **Backend server code**: use `rpc.*` methods directly from `@/lib/stellar-config`
- See `references/agentic-kit.md` for the complete API

---

## Agent Registry

| Agent | Role | Skills Loaded |
|-------|------|---------------|
| `@stellar-contracts` | Rust smart contracts (soroban-sdk) | smart-contracts + assets + zk-proofs |
| `@stellar-frontend` | Next.js + Stellar Wallets Kit + Tailwind CSS | dapp + data + frontend-design |
| `@stellar-backend` | Express + RPC services | data + agentic-payments |
| `@stellar-payments` | x402 + MPP payment flows | agentic-payments + assets |
| `@stellar-ops` | CI/CD + Docker + deploy | (no extra skills) |
| `@stellar-zk` | Groth16 + Circom + Noir | zk-proofs |

Each agent has **Memory Scope**: reads `data/` + `evals/`, writes to `data/projects/`, appends to `data/logs/`.

---

## MCP Integrations

Claude has direct access to the Stellar blockchain through MCP servers configured in `.mcp.json`:

| Server | Tools | Use For |
|--------|-------|---------|
| `stellar-rpc` | `get_account`, `get_contract_data`, `simulate_transaction`, `send_transaction`, `get_events` | Debugging, contract verification |
| `filesystem` | `read_file`, `write_file`, `list_directory`, `search_files` | Project file access |
| `github` | `create_or_update_file`, `search_repos`, `create_pull_request` | Repository management |
| `playwright` | `browser_navigate`, `browser_click`, `browser_screenshot` | E2E testing |

**Rule**: MCP for development/debugging; `useStellarData()` in production frontend code.

---

## Contract Deployment

Contracts are deployed through a gated workflow that runs tests first, then records the result.

### Deploy Gate

```
cargo test  →  FAIL → fix code → retry
           →  PASS → proceed to deploy
```

The deploy script (`scripts/deploy-contract.sh`) bails immediately if any test fails.

### Auto-Deploy (First Time)

If `data/deployments/testnet.json` does **not** exist (no prior deploy on that network), the agent deploys silently without prompting. On subsequent deploys it asks `Deploy <name> to testnet? [Y/n]`.

### Tracking

Every deploy writes to three places:

| Location | Purpose |
|----------|---------|
| `data/deployments/<network>.json` | Deploy tracker — contract ID, WASM hash, timestamp |
| `.env` | `NEXT_PUBLIC_<NAME>_CONTRACT_ID=<contract-id>` for frontend/backend |
| `NEXT_PUBLIC_*` env var | Accessible in browser code via `process.env` |

---

## Project Structure

```
stellar-forge/
├── SKILL.md                        # Orchestration skill (skillsdirectory.com format)
├── CLAUDE.md                       # Harness kernel — identity, routing, Skill Boot
├── agents/                         # 6 specialist agent definitions
│   ├── stellar-contracts.md
│   ├── stellar-frontend.md
│   ├── stellar-backend.md
│   ├── stellar-payments.md
│   ├── stellar-ops.md
│   └── stellar-zk.md
├── references/                     # Progressive-disclosure reference docs
│   ├── agents.md
│   ├── evals.md
│   ├── agentic-kit.md
│   └── templates.md
├── skills/                         # 10 bundled dependency skills (auto-installed)
│   ├── smart-contracts/            #   Rust + soroban-sdk
│   ├── dapp/                       #   Frontend hooks + examples
│   ├── data/                       #   RPC + Horizon queries
│   ├── assets/                     #   Classic assets + SAC bridge
│   ├── agentic-payments/           #   x402 + MPP
│   ├── standards/                  #   SEPs + CAPs
│   ├── zk-proofs/                  #   Groth16 + Circom
│   ├── stellar-mcp/                #   MCP tools guide
│   ├── frontend-design/            #   Tailwind CSS dApp UI patterns
│   └── graphify/                   #   Knowledge graphs
├── scripts/                        # Utility scripts
│   └── deploy-contract.sh          #   Build → test gate → deploy → record
├── templates/                      # Scaffold source code
│   ├── contracts/                  #   hello-world + SEP-41 token
│   ├── frontend/                   #   Next.js + hooks + components
│   ├── backend/                    #   Express + RPC + x402
│   └── cicd/                       #   GitHub Actions
├── evals/                          # 5 eval definitions
├── data/                           # Persistent memory
│   ├── projects/                   #   Per-project context
│   ├── decisions/                  #   ADR-format decisions
│   ├── deployments/                #   Contract deploy tracker
│   └── logs/                       #   Session logs
├── .claude/commands/               # 5 slash commands
├── .mcp.json                       # MCP server config
├── packages/create-stellar-agentic # npm CLI package
└── .env.example                    # All env vars documented
```

---

## CLI Reference

### `npx create-stellar-agentic [name]`

| Flag | Description |
|------|-------------|
| `--yes` / `-y` | Skip all prompts (defaults) |
| `--skill-only` | Install skill only, skip project scaffold |
| `--no-install` | Skip npm install after scaffold |
| `--template <type>` | Scaffold type: `full`, `contract-only`, `frontend-only`, `backend-only`, `payment-only` |

### `npx skills add rylsherdamz-rgb/stellar-forge`

| Flag | Description |
|------|-------------|
| `-y` | Skip confirmation prompt |
| `-g` | Install globally (not just project-local) |
| `--agent claude-code` | Register for Claude Code (default) |
| `--agent cursor` | Register for Cursor |
| `--agent copilot` | Register for GitHub Copilot |

---

## Eval-Driven Development

Every task starts with defined success criteria. Evals catch failures early and steer agents with corrective context.

| Eval | What It Checks |
|------|---------------|
| `01-contract-eval` | Compiles to WASM, unit tests pass, auth on privileged fns, TTL on writes, deploy gated on all tests passing, contract ID recorded in tracker + `.env` |
| `02-frontend-eval` | TypeScript compiles, wallet connect/disconnect, contract read/write, no raw RPC |
| `03-backend-eval` | Server starts, balance & contract endpoints return valid data, CORS present |
| `04-e2e-eval` | End-to-end: contract deploys, wallet connects, transactions submit, payment flows succeed |
| `05-framework-eval` | All agents produced output, all evals ran, graphify completed, ADR written |

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `STELLAR_RPC_URL` | No | `https://soroban-testnet.stellar.org` | RPC endpoint |
| `STELLAR_NETWORK_PASSPHRASE` | No | `Test SDF Network ; September 2015` | Network passphrase |
| `STELLAR_SECRET_KEY` | For deploy | — | Deployer account secret |
| `STELLAR_DEPLOYER` | For deploy | `deployer` | Stellar CLI source account alias |
| `NEXT_PUBLIC_<NAME>_CONTRACT_ID` | After deploy | — | Auto-populated by deploy script |
| `OZ_CHANNEL_ID` | For x402 | — | OZ Channels facilitator ID |
| `OZ_API_KEY` | For x402 | — | OZ Channels API key |

### MCP Config (`.mcp.json`)

```json
{
  "mcpServers": {
    "stellar-rpc": {
      "command": "npx",
      "args": ["@stellar/mcp-server"],
      "env": {
        "STELLAR_RPC_URL": "https://soroban-testnet.stellar.org",
        "STELLAR_NETWORK_PASSPHRASE": "Test SDF Network ; September 2015"
      }
    }
  }
}
```

---

## FAQ

**Q: Do I need to install all 10 dependency skills manually?**  
No. The CLI and `npx skills add` both auto-install missing skills from the bundled `skills/` directory.

**Q: Can I use this without Claude Code?**  
Yes. The scaffold CLI (`npx create-stellar-agentic`) works standalone. The harness kernel (CLAUDE.md) only activates in Claude Code sessions.

**Q: What Stellar networks are supported?**  
Testnet (default), mainnet/pubnet, and local/testcontainer. Configure via `.env` or `lib/stellar-config.ts`.

**Q: How do eval retries work?**  
Each agent gets max 3 attempts. On failure, the kernel provides the eval failure details as corrective context for the retry.

**Q: Can I add my own agents?**  
Yes. Create an agent file in `agents/`, add it to the registry in CLAUDE.md, and define the associated eval in `evals/`.

---

## Related

- [Stellar Documentation](https://developers.stellar.org/docs)
- [Stellar Wallets Kit](https://github.com/Creit-Tech/Stellar-Wallets-Kit)
- [Stellar Agentic Kit](https://github.com/stellar/stellar-agentic-kit)
- [OpenZeppelin Stellar Contracts](https://github.com/OpenZeppelin/stellar-contracts)
- [Skills Directory](https://www.skillsdirectory.com/)
- [NPXSkills](https://npxskills.xyz/)

---

<p align="center">
  <sub>Built with the Stellar Forge · <a href="https://www.npmjs.com/package/create-stellar-agentic">npm</a> · <a href="https://github.com/rylsherdamz-rgb/stellar-forge">GitHub</a></sub>
</p>
