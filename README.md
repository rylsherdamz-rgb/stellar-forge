<div align="center">

  <img src="https://stellar-agentic-framework.vercel.app/favicon.svg" width="48" height="48" alt="Stellar Forge">

  <br>

  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/stellar-forge-7B3FE4?style=for-the-badge&logo=stellar&logoColor=white&labelColor=1a1a2e">
    <img alt="Stellar Forge" src="https://img.shields.io/badge/stellar-forge-7B3FE4?style=for-the-badge&logo=stellar&logoColor=white&labelColor=ffffff">
  </picture>

  <br>

  <a href="https://github.com/rylsherdamz-rgb/stellar-forge">
    <img src="https://img.shields.io/github/last-commit/rylsherdamz-rgb/stellar-forge?color=7B3FE4&logo=github&label=updated">
  </a>
  <a href="https://github.com/rylsherdamz-rgb/stellar-forge/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/rylsherdamz-rgb/stellar-forge/ci.yml?branch=master&label=ci&logo=github">
  </a>
  <a href="https://www.npmjs.com/package/create-stellar-agentic">
    <img src="https://img.shields.io/npm/v/create-stellar-agentic?color=blue&logo=npm&label=cli">
  </a>
  <a href="https://www.npmjs.com/package/create-stellar-agentic">
    <img src="https://img.shields.io/npm/dw/create-stellar-agentic?color=blue&logo=npm&label=downloads%2Fweek">
  </a>
  <a href="https://www.npmjs.com/package/create-stellar-agentic">
    <img src="https://img.shields.io/npm/dt/create-stellar-agentic?color=blue&logo=npm&label=total%20downloads">
  </a>
  <a href="https://stellar-agentic-framework.vercel.app">
    <img src="https://img.shields.io/badge/website-7B3FE4?logo=vercel&logoColor=white&label=docs">
  </a>
  <a href="https://x.com/ChichiCode0/status/2084510317862895653">
    <img src="https://img.shields.io/badge/watch--promo-7B3FE4?logo=x&logoColor=white&label=60s">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-green">
  </a>

  <br><br>

  <p><b>AI orchestration + project scaffolding for Stellar dApps.</b><br>
  An open-source reference implementation for AI-assisted Stellar development — six specialist agents write, verify, and deploy contracts, frontends, and payment APIs, no context-switching.<br>
  <a href="https://stellar-agentic-framework.vercel.app" style="color:#7c3aed;text-decoration:none;">stellar-agentic-framework.vercel.app</a> · <a href="https://x.com/ChichiCode0/status/2084510317862895653" style="color:#7c3aed;text-decoration:none;">▶ Watch the 60s promo</a></p>

  <table>
    <tr>
      <td align="center"><b>🧠 Agent Skill</b><br><sub>For Claude Code / OpenCode — 6 agents<br>that build your dApp from one prompt</sub></td>
      <td width="30"></td>
      <td align="center"><b>📦 Scaffold CLI</b><br><sub><code>npx create-stellar-agentic</code><br>Production monorepo in one command</sub></td>
    </tr>
  </table>

  <br>

  <video width="840" controls muted playsinline preload="metadata" poster="https://stellar-agentic-framework.vercel.app/promo-poster.png" style="max-width:100%;border-radius:14px;border:1px solid #1c1c2e;box-shadow:0 24px 80px rgba(0,0,0,.5)">
    <source src="https://github.com/rylsherdamz-rgb/stellar-forge/raw/master/media/promo.mp4" type="video/mp4">
  </video>
</div>

---

## What Is This?

Stellar Forge is **two things that work together**:

1. **An AI orchestration layer** (the "Skill") — a set of six specialist agent definitions + a graph engine kernel (`CLAUDE.md`) that routes your requests to the right agents, verifies their output against structured evals, and steers on failure. It runs inside Claude Code or OpenCode.

2. **A project scaffold CLI** (`create-stellar-agentic`) — generates a production-ready Stellar monorepo with contracts, frontend, backend, CI/CD, and agent files pre-configured. If you use Claude Code, it auto-installs the Skill too.

**The CLI bootstraps the project. The Skill builds it.** You can use either independently — together they're a complete workflow.

> **Stellar Forge** is an open-source reference implementation (MIT) demonstrating a supported AI-assisted Stellar development workflow: install the Skill → scaffold with the CLI → build & refine with AI assistance → evaluate against structured checks → validate on Stellar Testnet. See the [Instawards Statement of Work](docs/INSTAWARD-SOW.md) for the full scope.

---

## Who Is This For?

| You are... | Use the... |
|---|---|
| A Stellar developer who uses Claude Code | Skill — adds 6 agents to your sessions |
| Starting a new Soroban dApp from scratch | CLI — scaffolds a monorepo with everything wired |
| Building a paid API with x402/MPP | Both — CLI for structure, Skill for implementation |
| A hackathon participant shipping fast | Both — one command to scaffold, one prompt to build |
| Already have a project, want AI assistance | Skill — drops into any existing repo |
| Evaluating Stellar without Claude Code | CLI — standalone scaffold, no AI required |

---

## Why Not Just Use ChatGPT / Copilot / Cursor?

Generic AI tools don't know Stellar. They don't know that:
- Contracts must be `#![no_std]` with `soroban-sdk`
- Wallet connection requires Stellar Wallets Kit (not wagmi)
- x402 payments need OZ Channels facilitator + CAIP-2 network IDs
- The correct curve for on-chain ZK verification is BLS12-381, not BN254

Stellar Forge **embeds that domain knowledge** into 10 installable skills, 6 agent definitions, and 5 eval files. Every agent checks its output against structured pass/fail criteria before handing off. It's not a chat — it's a multi-agent graph engine with domain expertise.

---

## Architecture

```
stellar-forge/
├── SKILL.md          # Entry point — loads the graph engine
├── CLAUDE.md         # Graph engine kernel — routes tasks as work graphs
│
├── agents/           # 6 agent definitions (node prompts)
│   ├── stellar-contracts.md
│   ├── stellar-frontend.md
│   ├── stellar-backend.md
│   ├── stellar-payments.md
│   ├── stellar-ops.md
│   └── stellar-zk.md
│
├── skills/           # Domain knowledge (loaded on demand)
│   ├── smart-contracts/   →  soroban-sdk, WASM, storage, auth, testing
│   ├── dapp/              →  Wallets Kit, tx building, React hooks
│   ├── data/              →  RPC + Horizon, event queries
│   ├── assets/            →  SAC, trustlines, classic tokens
│   ├── agentic-payments/  →  x402, MPP Charge/Channel
│   ├── standards/         →  SEPs, CAPs, ecosystem
│   ├── zk-proofs/         →  Groth16, BLS12-381, Circom/Noir
│   ├── stellar-mcp/       →  MCP server tools
│   ├── frontend-design/   →  dApp UI patterns
│   └── graphify/          →  Knowledge graphs
│
├── evals/            # Pass/fail criteria per component
│   ├── 01-contract-eval.md
│   ├── 02-frontend-eval.md
│   └── ...
│
├── templates/        # Source templates for CLI scaffold
│   ├── contracts/
│   ├── frontend/
│   ├── backend/
│   └── cicd/
│
├── packages/create-stellar-agentic/  # npm-published CLI
└── .claude/commands/  # Slash commands
```

### How the Pieces Connect

```
You (prompt)
   │
   ▼
Graph Engine (CLAUDE.md)
   │  Parses intent, generates a work graph
   │
   ├──────────────────┬──────────────────┐
   │                  │                  │
   ▼                  ▼                  ▼
Agent Node 1      Agent Node 2      Agent Node 3
(contracts)       (frontend)        (backend)
   │                  │                  │
   ▼                  ▼                  ▼
Verifier (eval)   Verifier (eval)   Verifier (eval)
   │                  │                  │
   └──────────────────┼──────────────────┘
                      ▼
               Synthesize → Report
```

---

## The Kernel

The kernel (`CLAUDE.md`) is the graph engine. It is **not a runtime** — it is a structured prompt that tells the AI how to organize its own work. It defines:

- **Org graph** — 6 agent nodes with zone ownership and persistent context
- **Work graph generation** — how to wire agents together per task (sequential, parallel, conditional, fan-out, fan-in)
- **Node execution contract** — what the kernel passes to each agent (intent + context + tools) and what it expects back (output + state delta + verifier result)
- **Edge definitions** — what data flows between nodes (contract IDs, ABI, payment middleware config, API endpoints)
- **Failure recovery** — retry same node → reroute to fallback → escalate

Each task gets a dynamically-generated work graph. For `"Build a token contract with a React frontend"`, the graph is:

```
[contracts] ──(contract_id)──→ [frontend]
     ↓                              ↓
  verifier                       verifier
  (pass)                         (pass) → [kernel: synthesize]
```

---

## The 6 Agents

These are **prompt-based agent definitions** in `agents/*.md`. Each is a structured instruction set (not a running process) that tells the AI which zone it owns, what data it needs, what tools it can use, and what constraints apply.

| Agent | Zone | Input Edge | Output Edge |
|---|---|---|---|
| `@stellar-contracts` | Rust smart contracts, WASM, testnet deploy | @stellar-zk (verifier WASM) | → @stellar-frontend (contract IDs) |
| `@stellar-frontend` | Next.js 15, Wallets Kit, transaction UX | @stellar-contracts (contract IDs) | → @stellar-backend (API needs) |
| `@stellar-backend` | Express, RPC, event indexers | @stellar-frontend (API shapes), @stellar-payments (middleware) | → @stellar-ops (Dockerfile) |
| `@stellar-payments` | x402, MPP Charge/Channel, USDC | @stellar-contracts (token addresses) | → @stellar-backend (middleware code) |
| `@stellar-ops` | CI/CD, Docker, GitHub Actions | All nodes (build artifacts) | → deploy targets |
| `@stellar-zk` | Groth16 verifiers, Circom, Noir | — | → @stellar-contracts (verifier contract) |

You can customize, add, or remove agents — each is just a markdown file in `agents/`. Register new agents in the `CLAUDE.md` org graph table.

---

## Installation

### Which One?

| I want to... | Install this |
|---|---|
| Add AI orchestration to an existing Stellar project | **Skill** → `npx skills add rylsherdamz-rgb/stellar-forge` |
| Scaffold a brand-new Stellar dApp monorepo | **CLI** → `npx create-stellar-agentic my-dapp` |
| Build a dApp with AI assistance (recommended) | **Both** — CLI scaffolds the project, Skill builds it |
| Use AI agents without Claude Code | **CLI only** — standalone scaffolding, no AI required |

### Skill (AI Orchestration)

```bash
# For Claude Code or OpenCode
npx skills add rylsherdamz-rgb/stellar-forge

# Specify the agent
npx skills add rylsherdamz-rgb/stellar-forge --agent claude-code
npx skills add rylsherdamz-rgb/stellar-forge --agent opencode
```

After installing, start a session and prompt:

> *"Build a token contract with a React frontend and x402 payments"*

The graph engine routes to the relevant agents, each with domain skills and evals loaded. Outputs are verified against pass/fail criteria, with up to 3 retries on failure.

### CLI (Project Scaffold)

```bash
npx create-stellar-agentic my-dapp
```

This generates a production-ready monorepo:

```
my-dapp/
├── contracts/          # Rust smart contracts (hello-world + SEP-41 token)
├── frontend/           # Next.js 15 + Wallets Kit + hooks + components
├── backend/            # Express + RPC + x402/MPP payment middleware
├── .github/workflows/  # CI/CD for contracts, frontend, backend
├── scripts/            # deploy-contract.sh (test gate → deploy → record)
├── agents/             # 6 agent definitions (works with Claude Code)
├── evals/              # Eval criteria per component
├── CLAUDE.md           # Graph engine kernel
└── SKILL.md            # Orchestration entry point
```

**Killer feature: the CLI automatically installs the Skill.** When you run `npx create-stellar-agentic`, it copies all 10 skills to `~/.claude/skills/` and sets up the `CLAUDE.md` kernel. Opening the generated project in Claude Code instantly activates the full multi-agent harness — no extra steps.

### CLI Options

| Flag | Description |
|---|---|
| `--yes` / `-y` | Skip all prompts |
| `--template <type>` | `full` (default), `contract-only`, `frontend-only`, `backend-only`, `payment-only` |
| `--skill-only <dir>` | Install only skill files into an existing project |
| `--no-install` | Skip npm install after scaffold |

---

## Features

### Agentic Kit Hooks (no raw RPC)

| Hook | Import | Use |
|---|---|---|
| `useStellarData()` | `@/hooks/use-stellar-data` | Balances, contract queries, events, transactions |
| `useContract(id)` | `@/hooks/use-contract` | `read()` (simulation) / `write()` (sign+submit) |
| `useStellarWallet()` | `@/hooks/use-stellar-wallet` | Connect, disconnect, sign, getBalances |
| `useWallet()` | `@/providers/wallet-provider` | Context wrapper |

### Eval-Driven Pipeline

Each agent's output is checked against structured pass/fail criteria. If it fails, the kernel feeds the failure details back as corrective context (max 3 retries).

| Eval | Checks |
|---|---|
| 01-contract | WASM compiles, tests pass, auth on privileged fns, TTL on writes, deploy gate |
| 02-frontend | TypeScript compiles, wallet connect/disconnect, contract read/write, no raw RPC |
| 03-backend | Server starts, balance + contract endpoints, CORS |
| 04-payment | x402 rejects unpaid with 402, accepts valid payment |
| 05-framework | All agents produced output, all evals ran, graphify completed |

### MCP Integrations

| Server | Tools |
|---|---|
| stellar-rpc | `get_account`, `get_contract_data`, `simulate_transaction` |
| filesystem | `read_file`, `write_file`, `list_directory` |
| github | `create_or_update_file`, `search_repos`, `create_pull_request` |
| playwright | `browser_navigate`, `browser_click`, `browser_screenshot` |

### Contract Deployment

Test-gated deployment — `cargo test` must pass or the deploy aborts.

- **First deploy** on a network: auto-deploys, records to `data/deployments/`, updates `.env`
- **Subsequent deploys**: prompts for confirmation

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `STELLAR_RPC_URL` | No | `https://soroban-testnet.stellar.org` | RPC endpoint |
| `STELLAR_NETWORK_PASSPHRASE` | No | `Test SDF Network ; September 2015` | Network passphrase |
| `STELLAR_SECRET_KEY` | For deploy | — | Deployer account secret |
| `STELLAR_DEPLOYER` | For deploy | `deployer` | Stellar CLI source account |
| `OZ_CHANNEL_ID` | For x402 | — | OZ Channels facilitator ID |
| `OZ_API_KEY` | For x402 | — | OZ Channels API key |

---

## FAQ

**Can I use this without Claude Code?**  
Yes. `npx create-stellar-agentic` works standalone. The graph engine only activates in Claude Code sessions.

**What networks are supported?**  
Testnet (default), mainnet, and local/testcontainer. Mainnet requires explicit env opt-in.

**How do eval retries work?**  
Each agent gets max 3 attempts. On failure, the kernel feeds the eval failure details back as corrective context for the retry.

**How do I add my own agent?**  
Create an agent file in `agents/`, register it in `CLAUDE.md`'s org graph table, and add its eval to `evals/`.

**My contracts don't compile — what SDK version?**  
Template contracts target `soroban-sdk = "27.0.0-rc.1"`. Run `cargo update` for a newer patch.

---

## Related


- [Documentation & Demo](https://stellar-agentic-framework.vercel.app)
- [Stellar Documentation](https://developers.stellar.org/docs)
- [Stellar Wallets Kit](https://github.com/Creit-Tech/Stellar-Wallets-Kit)
- [Stellar Agentic Kit](https://github.com/stellar/stellar-agentic-kit)
- [OpenZeppelin Stellar Contracts](https://github.com/OpenZeppelin/stellar-contracts)

---

<p align="center">
  <sub>Built with Stellar Forge · <a href="https://stellar-agentic-framework.vercel.app">Website</a> · <a href="https://github.com/rylsherdamz-rgb/stellar-forge">GitHub</a> · <a href="https://www.npmjs.com/package/create-stellar-agentic">npm</a></sub>
</p>
