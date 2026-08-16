---
name: stellar-forge
description: >
  Eval-driven coding harness for building production Stellar dApps. Routes
  tasks to 6 specialist agents, verifies output with structured evals, steers
  on failure, e2e-tests with Stellar Agentic Kit hooks, and knowledge-graphs
  every project. Use when building any Stellar app — tokens, DeFi, NFTs,
  payment APIs, or full dApps with smart contracts + frontend + backend.
version: 1.1.0
author: rylsherdamz-rgb
tags:
  - stellar
  - soroban
  - smart-contracts
  - dapp
  - frontend
  - agent
  - multi-agent
  - eval-driven
  - coding-harness
  - x402
  - mpp
  - agentic-payments
homepage: https://github.com/rylsherdamz-rgb/stellar-forge
---

# Stellar Agentic Framework

Build production Stellar dApps with an eval-driven, multi-agent coding harness.

## When to Use

- Building a Stellar smart contract (token, DeFi, NFT, zk)
- Scaffolding a full dApp with wallet connect + contract interaction
- Setting up x402 payment middleware for a paid API
- Creating a Stellar frontend with Stellar Wallets Kit
- Writing backend services that query Stellar chain data
- Need eval-driven quality gates for Stellar development

## How It Works

The harness routes your request to 6 specialist agents running in parallel, verifies every output against structured evals, steers on failure (max 3 retries), and produces an eval report.

```
User Request → Route to Agents → Parallel Build → Verify with Evals → Report
                                  ┌──────────────┐
                                  │ @contracts   │
                                  │ @frontend    │
                                  │ @backend     │
                                  │ @payments    │
                                  │ @ops         │
                                  │ @zk          │
                                  └──────────────┘
```

## Setup

### Install the Framework

```bash
npx create-stellar-agentic my-dapp
cd my-dapp
npm install
```

This scaffolds a full project with contracts, frontend, and backend templates.

### Or Install as a Skill Only

```bash
npx create-stellar-agentic --skill-only .
```

Or from the registry:

```bash
npx skills add rylsherdamz-rgb/stellar-forge
```

## Workflow

### Phase 1 — Intent Capture
Describe what you're building. The harness maps keywords to eval templates and writes a decision record.

| Request | Evals Used |
|---------|-----------|
| "Build a token contract" | contract + asset |
| "DeFi lending platform" | contract + backend |
| "Paid API with x402" | agentic-payments |
| "NFT marketplace" | contract + frontend |
| "Full dApp" | all evals |

### Phase 2 — Plan & Spawn Agents
The kernel first plans the work graph (nodes, edges, waves, file ownership — written to `data/graphs/<task>.json`), then routes sub-tasks to specialist agents **in parallel waves** — every independent agent of a wave is spawned in one batch. Each agent receives your intent, eval criteria, owned paths, and interface contract.

See `references/agents.md` for the full agent registry and `references/work-graph.md` for the parallel execution protocol.

### Phase 3 — Verify & Steer
After agents complete, evals check every output. Failed evals trigger corrective retries (max 3).

Evals cover: contract compilation, TypeScript types, wallet connect, contract read/write, server startup, x402 payment flow, and graph health.

See `references/evals.md` for full criteria.

### Phase 4 — E2E Test
1. Start local Stellar network
2. Deploy contracts
3. Run Playwright e2e tests
4. Run Stellar Agentic Kit payment tests

### Phase 5 — Report
```
STELLAR CODING HARNESS :: EVAL REPORT
Project: <name>
CONTRACT EVALS:     X/Y passed
FRONTEND EVALS:     X/Y passed
BACKEND EVALS:      X/Y passed
PAYMENT EVALS:      X/Y passed
E2E EVALS:          X/Y passed
Overall:            SHIP IT / NEEDS WORK
```

## Agentic Kit — Blockchain Data Queries

All blockchain queries use `useStellarData()` — never raw RPC or curl.

```tsx
import { useWallet } from "@/providers/wallet-provider";
import { useContract } from "@/hooks/use-contract";

function MyComponent({ contractId }: { contractId: string }) {
  const { address, getBalances } = useWallet();
  const { read, write } = useContract(contractId);
  // read() = simulation only, no fees
  // write() = full sign + submit + confirm
}
```

For the complete hook API, see `references/agentic-kit.md`.

## Examples

### Input
"Create a token contract with a React frontend to display balances"

### Output
The harness spawns `@stellar-contracts` (builds SEP-41 token) and `@stellar-frontend` (creates ConnectButton + balance viewer using `useStellarData().getBalances`), verifies both against evals, and produces an eval report.

### Input
"Add x402 payment to my Express API"

### Output
The harness spawns `@stellar-payments` which adds `x402Middleware` from `templates/backend/src/middleware/x402.ts`, configures the OZ channel, and verifies the payment flow works.

## Strict Rules

- **All blockchain queries** must use `useStellarData()` — no raw RPC, no `curl`
- **Read-only contract state** uses `useContract().read()` — simulation only, zero fees
- **State-changing calls** use `useContract().write()` — handles sim + assemble + sign + submit
- **Every output** must pass relevant evals before reporting done
- **All decisions** logged to `data/decisions/` in ADR format

## Avoid

- Do NOT use raw `fetch()` or `axios` to call Stellar RPC endpoints directly
- Do NOT skip eval verification — always run evals against agent output
- Do NOT hardcode secrets — use `.env.local` (frontend) or `.env` (backend)
- Do NOT write monolithic agents — route to specialists for each concern
- Do NOT skip the graphify step — it builds the project knowledge base

## Slash Commands

## MCP Tools

Claude has direct access to the Stellar blockchain, filesystem, GitHub, and Playwright through MCP servers configured in `.mcp.json`.

| Server | Tools | Use For |
|--------|-------|---------|
| `stellar-rpc` | `get_account`, `get_contract_data`, `simulate_transaction`, `send_transaction`, `get_events` | Chain queries during development, debugging |
| `filesystem` | `read_file`, `write_file`, `list_directory`, `search_files` | Reading/writing project files |
| `github` | `create_or_update_file`, `search_repos`, `create_pull_request` | Repository management, commits, PRs |
| `playwright` | `browser_navigate`, `browser_click`, `browser_type`, `browser_screenshot` | E2E testing of Stellar dApps |

**Rule**: Use MCP tools during development/debugging, `useStellarData()` in production frontend code. See `skills/stellar-mcp/SKILL.md` for full details.

## Slash Commands

## Reference Files

| File | Contents |
|------|----------|
| `references/agents.md` | Full agent registry with skills and memory scope |
| `references/evals.md` | All 5 eval definitions with pass/fail criteria |
| `references/agentic-kit.md` | Complete hook API reference |
| `references/templates.md` | Template file index and purpose |
| `agents/*.md` | Individual agent instructions (loaded by kernel) |
| `evals/*.md` | Individual eval criteria (loaded by verifier) |
| `templates/` | Source code templates for code generation |
| `.mcp.json` | MCP server configuration (Stellar RPC, filesystem, GitHub, Playwright) |
| `skills/stellar-mcp/SKILL.md` | MCP tool usage guide and patterns |
