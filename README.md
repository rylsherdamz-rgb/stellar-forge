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
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-green">
  </a>
  <a href="SPEC.md">
    <img src="https://img.shields.io/badge/spec-MVP%201.0-7B3FE4">
  </a>
  <img src="https://img.shields.io/badge/network-Stellar%20Testnet-7B3FE4?logo=stellar&logoColor=white">

  <br><br>

  <p><b>A Stellar-native developer bounty &amp; escrow marketplace.</b><br>
  Fund software work. Build software. Get paid on Stellar. Rewards are held in a
  Soroban smart contract and released only when work is approved — the blockchain
  controls the money, not the frontend.</p>

</div>

---

## What Is This?

Stellar Forge lets project owners post **software bounties** funded with real XLM or
USDC, held in a **Soroban escrow contract**. Developers claim work, complete it,
submit a GitHub Pull Request as proof, and — once the owner approves — the contract
releases the reward directly to their Stellar wallet.

> **Stellar Forge is a Stellar-native developer bounty marketplace that uses Soroban
> smart contracts to escrow and automatically settle XLM or USDC rewards when
> software work is approved.**

The full product specification lives in [SPEC.md](SPEC.md).

## Why Escrow On-Chain?

Traditional bounty systems depend on trust: developers don't know if a reward is
actually funded, and owners hesitate to pay before seeing results. Stellar Forge
combines the reward and the verification into one programmable agreement:

```text
Software Bounty  +  Programmable Escrow  +  Stellar Settlement  +  GitHub Proof
```

The reward is deposited into the contract **at creation time**, so every open bounty
is provably funded. Funds only move on a valid, authorized state transition.

## Core Flow

```text
Project Owner ──create + deposit──▶ Soroban Escrow ──open──▶ Developer
      ▲                                                          │
      │                                                     claim + build
   approve                                                       │
      │                                                          ▼
      └───────────────── review ◀── GitHub PR ◀── submit proof ──┘
                                          │
                                     approve & pay
                                          ▼
                              Reward released to Developer wallet
```

## The Escrow Contract

The heart of the product is [`contracts/bounty-escrow`](contracts/bounty-escrow) — a
Soroban contract that owns the full bounty state machine on-chain.

| Function | Who | Effect |
|---|---|---|
| `create_bounty(creator, token, amount, deadline, metadata_hash)` | creator | Pulls the reward into escrow, opens the bounty, returns `id` |
| `claim_bounty(bounty_id, developer)` | developer | `Open → Claimed` (rejects double-claim, past deadline) |
| `submit_bounty(bounty_id, developer, submission_hash)` | claiming developer | `Claimed → Submitted` |
| `approve_bounty(bounty_id)` | creator | Verifies state + auth, **transfers reward**, `Submitted → Completed` |
| `release_payment(bounty_id)` | creator | Explicit release alias |
| `cancel_bounty(bounty_id)` | creator | Refunds an unclaimed bounty, `Open → Cancelled` |
| `refund_bounty(bounty_id)` | creator | Refunds after deadline, `→ Refunded` |
| `get_bounty(id)` / `next_id()` / `admin()` | anyone | Read-only views |

On-chain status: `Open · Claimed · Submitted · Completed · Cancelled · Expired · Disputed · Refunded`.

**Security model:** only the creator can approve; only the claiming developer can
submit; `amount > 0`, the deadline, and every state transition are enforced in the
contract. The frontend is never trusted to decide whether money moves.

### Live on Stellar Testnet

| | |
|---|---|
| **Contract ID** | `CCUG6LFKZLTYX7R2KVHAT5ZGWT54CZFJ5SMEYMSUPMLPHASYOWONLKZU` |
| **Admin** | `GD4QKRYD5ZCVU4ZT6MLGYYQZGNCMMN54BTIXMYJONML66M3HTHCKECDW` |
| **Explorer** | [stellar.expert](https://stellar.expert/explorer/testnet/contract/CCUG6LFKZLTYX7R2KVHAT5ZGWT54CZFJ5SMEYMSUPMLPHASYOWONLKZU) |

See [`data/deployments/testnet.json`](data/deployments/testnet.json).

## Build & Test the Contract

```bash
# run the full test suite (17 tests: happy path, auth, every failure transition)
cargo test --manifest-path contracts/bounty-escrow/Cargo.toml

# build the optimized wasm
stellar contract build --manifest-path contracts/bounty-escrow/Cargo.toml

# deploy to testnet
stellar contract deploy \
  --wasm contracts/target/wasm32v1-none/release/bounty_escrow.wasm \
  --source deployer --network testnet
```

## Architecture

```text
                         STELLAR FORGE
                              │
             ┌────────────────┼────────────────┐
             │                │                │
        Bounty System    GitHub System    AI Assistant (advisory)
             │                │                │
             └────────────────┼────────────────┘
                              │
                        Stellar Wallet
                              │
                    ┌─────────┴─────────┐
                    │  Soroban Escrow   │
                    └─────────┬─────────┘
                       XLM ───┴─── USDC
                              │
                       Developer Wallet
```

## Technology Stack

| Layer | Tech |
|---|---|
| Smart contract | Soroban, `soroban-sdk`, Rust `#![no_std]` |
| Frontend | Next.js, TypeScript, Tailwind, shadcn/ui, Stellar Wallets Kit |
| Backend / API | Next.js API routes / Node.js, TypeScript |
| Database | PostgreSQL / Supabase (metadata only — **not** the source of truth for funds) |
| Chain access | Stellar Horizon / Soroban RPC |
| Auth | Stellar wallet (primary), optional GitHub OAuth |
| AI | OpenAI-compatible / local LLM (advisory only, never controls funds) |

## Target Repository Structure

```text
stellar-forge/
├── apps/web/                 # Next.js app (pages + API routes)
├── contracts/bounty-escrow/  # Soroban escrow contract  ✅ built + deployed
├── packages/{stellar,database,github,ai}/
├── data/deployments/         # recorded on-chain deployments
├── SPEC.md                   # product specification (source of truth)
└── README.md
```

## Design Principles

1. **Stellar first** — settlement and escrow are essential, not decorative.
2. **Blockchain where trust matters** — money and state on-chain; descriptions and UI off-chain.
3. **AI is assistive** — it drafts bounties and summarizes submissions; it never touches funds.
4. **Human approval** — a person decides whether work is accepted.
5. **Verifiable payments** — every reward is a verifiable Stellar transaction.
6. **Minimal MVP** — prove real task + real developer + real escrow + real Stellar settlement.

## Roadmap

- **V1** — Bounties + Soroban escrow + XLM/USDC + GitHub _(current)_
- **V2** — Milestones, multiple reviewers, reputation, notifications, org accounts
- **V3** — AI code review, automated requirement checking, advanced disputes, teams
- **V4** — Agentic bounties, x402/MPP, machine-to-machine payments

## Related

- [Stellar Documentation](https://developers.stellar.org/docs)
- [Soroban Smart Contracts](https://developers.stellar.org/docs/build/smart-contracts)
- [Stellar Wallets Kit](https://github.com/Creit-Tech/Stellar-Wallets-Kit)

---

<p align="center">
  <sub>Built with Stellar Forge · <a href="https://github.com/rylsherdamz-rgb/stellar-forge">GitHub</a> · MIT</sub>
</p>
