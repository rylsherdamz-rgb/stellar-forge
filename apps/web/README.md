# Stellar Forge — Web Application (`apps/web`)

The reference bounty & escrow marketplace UI for Stellar Forge. It lets a project
owner create and fund a bounty, and a developer browse, claim, and submit proof of
work — all wired to the deployed Soroban escrow contract on Stellar Testnet.

> The web app never moves funds. It builds transactions, the **wallet signs** them,
> and the **Soroban contract** decides whether funds are released or refunded.

## Architecture

```text
Browser (Next.js pages)
  │  connect wallet (Stellar Wallets Kit)  →  address
  │  request unsigned XDR                  →  POST /api/bounties/:id/build
  │  sign XDR with wallet
  │  submit signed XDR                     →  POST /api/bounties/:id/confirm
  ▼
Next.js API routes (server)
  ├─ lib/contract.ts   builds Soroban invoke tx (create/claim/submit/approve/refund/cancel)
  ├─ lib/store.ts      JSON metadata layer (descriptions, submissions) linked to escrowId + tx hashes
  └─ @stellar-forge/github  verifies the submitted PR (repo + author)
  ▼
Soroban RPC  →  bounty-escrow contract  →  Stellar Testnet settlement
```

- **On-chain (source of truth):** state, ids, balances, deadlines. Contract:
  `CCUG6LFKZLTYX7R2KVHAT5ZGWT54CZFJ5SMEYMSUPMLPHASYOWONLKZU`.
- **Off-chain (metadata only):** titles, descriptions, requirements, submission
  records — each linked to its on-chain `escrowId` and transaction hashes.

## Pages

| Route | Purpose |
|---|---|
| `/` | Landing + how it works |
| `/bounties` | Public list of funded bounties |
| `/bounties/[id]` | Detail + claim / approve & pay / refund / cancel |
| `/bounties/[id]/submit` | Submit a GitHub PR as proof of work |
| `/create` | Create a bounty and fund the escrow |

## API routes

| Route | Method | Purpose |
|---|---|---|
| `/api/bounties` | GET / POST | List / create bounty metadata |
| `/api/bounties/:id` | GET | Single bounty |
| `/api/bounties/:id/build` | POST | Build an unsigned XDR for an action |
| `/api/bounties/:id/confirm` | POST | Submit signed XDR, sync state, verify PR |
| `/api/chain` | GET | Contract `next_id` + latest ledger |
| `/api/github/pull-request` | GET | Verify a PR against repo + author |

## Environment

Copy `.env.example` to `.env.local`. Defaults target Stellar Testnet, so it runs
out of the box.

| Var | Default | Notes |
|---|---|---|
| `NEXT_PUBLIC_STELLAR_NETWORK` | `testnet` | |
| `NEXT_PUBLIC_STELLAR_RPC_URL` | `https://soroban-testnet.stellar.org` | Soroban RPC |
| `NEXT_PUBLIC_NETWORK_PASSPHRASE` | `Test SDF Network ; September 2015` | |
| `NEXT_PUBLIC_CONTRACT_ID` | deployed testnet id | bounty-escrow |
| `NEXT_PUBLIC_XLM_SAC` | native XLM SAC | settlement token |
| `GITHUB_TOKEN` | — | server-only; raises PR-verification rate limits |

## Run

```bash
# from the repo root (workspaces resolve @stellar-forge/github)
npm install
npm run build -w @stellar-forge/web     # production build
npm run dev  -w @stellar-forge/web       # dev server at http://localhost:3000
```

## Settlement asset

XLM is the sole settlement asset (per the Instaward SOW). The contract is
asset-agnostic — it takes a token `Address` — and the app wires the native XLM
Stellar Asset Contract as that token, so deposits and releases move real XLM on
Testnet.
