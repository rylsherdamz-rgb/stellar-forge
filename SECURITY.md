# Security Policy

## Supported Versions

| Version | Supported |
|---------|----------|
| 1.x     | ✅ |

## Reporting a Vulnerability

Stellar Forge escrows real XLM and USDC in a Soroban smart contract. Security issues
in the contract or the funds-handling paths are treated as critical.

If you discover a security issue:

1. **Do not** open a public GitHub issue.
2. **Do not** post details in public forums.
3. Open a [GitHub Security Advisory](https://github.com/rylsherdamz-rgb/stellar-forge/security/advisories/new)
   or email the maintainer directly.

### Response Timeline

- Acknowledgment: within 48 hours
- Assessment: within 5 business days
- Fix: timeline depends on severity

## Security Model

The single most important rule:

> **The frontend is never trusted to decide whether money moves. The Soroban
> contract is the source of truth for escrow state.**

### Smart Contract Guarantees (`contracts/bounty-escrow`)

- **Authorization** — only the creator may `approve`/`cancel`/`refund`; only the
  claiming developer may `submit`; every privileged call uses `require_auth`.
- **State machine** — funds only move on a valid transition
  (`Open → Claimed → Submitted → Completed`, or the `Cancelled`/`Refunded` paths).
- **Amounts** — `amount > 0` enforced; transfers checked against contract balance
  (`Underfunded` guard) with `overflow-checks = true`.
- **Deadlines** — claims after the deadline are rejected; refunds before the
  deadline are rejected — both enforced on-chain against the ledger sequence.
- **Funded on creation** — the reward is pulled into escrow at `create_bounty`, so
  every open bounty is provably funded.

### Application Guarantees

- **No private keys** — Forge never requests or stores private keys or seed phrases.
  All financial actions require an explicit wallet signature.
- **Asset verification** — only verified `asset_code` / `asset_issuer` / `network`
  combinations (XLM, canonical USDC) are accepted before a deposit.
- **Database is not the ledger** — off-chain metadata is cached and every financial
  event is independently verifiable via its Stellar transaction hash.
- **AI is advisory** — the AI assistant may draft bounties or summarize submissions
  but can never create escrow, transfer, release, or refund funds.
- **Secrets** — server secrets (Supabase service role, GitHub client secret, AI keys)
  are never exposed to the browser.

## Threat Model (summary)

| Threat | Mitigation |
|---|---|
| Fake / unfunded bounty | Reward escrowed on creation; funded status shown on-chain |
| Fake GitHub submission | PR existence, repository, and author verified via GitHub API |
| Unauthorized payment release | `require_auth` + wallet signatures in the contract |
| Frontend manipulation | Contract is the source of truth; UI cannot move funds |
| Fake asset | Verified asset registry (code + issuer + network) |
| Creator disappears | Deadline + creator-initiated refund path |
| Developer abandons work | Cancellation / post-deadline refund mechanism |
| Database compromise | Financial state remains on-chain and verifiable |

A fuller threat model lives in [`docs/THREAT-MODEL.md`](docs/THREAT-MODEL.md).

## Scope

Covered: the Soroban contract in `contracts/bounty-escrow/`, the funds-handling API
routes, wallet/auth flows, and asset verification. Excluded: the Stellar network
itself and third-party dependencies.
