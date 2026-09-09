# Stellar Forge

## Soroban-Powered Developer Bounty & Escrow Marketplace

**Version:** 1.0
**Status:** MVP Specification
**Target Network:** Stellar Testnet
**Primary Assets:** XLM, USDC
**Smart Contract Platform:** Soroban
**Frontend:** Next.js + TypeScript
**Backend:** Next.js API / Node.js
**Database:** PostgreSQL / Supabase
**Authentication:** Stellar wallet + optional GitHub OAuth

---

## 1. Project Overview

Stellar Forge is a Stellar-native marketplace for funding and completing software development work.

Project owners create software bounties with a defined reward, requirements, acceptance criteria, and deadline. The reward is deposited into a Soroban smart contract and held in escrow.

Developers browse available bounties, claim work, complete the requested task, and submit proof of completion, typically through a GitHub Pull Request.

The project owner reviews the submission. If the work is accepted, the Soroban contract releases the escrowed XLM or USDC to the developer. If the bounty expires, is cancelled according to the contract rules, or enters an approved dispute/refund path, funds can be returned according to the defined escrow rules.

## 2. Core Concept

```text
Project Owner --create--> Stellar Forge --deposit--> Soroban Escrow
--available--> Developer --complete--> GitHub PR --submit--> Project Owner
--approve--> Soroban Contract --release--> Developer Wallet
```

**The blockchain controls the actual reward.**

## 3. Bounty Lifecycle State Machine

```text
DRAFT -> FUNDING -> OPEN -> CLAIMED -> SUBMITTED -> APPROVED -> COMPLETED
OPEN -> EXPIRED -> REFUNDED
CLAIMED -> DISPUTED -> (REFUND | RELEASE)
OPEN -> CANCELLED -> REFUNDED
```

On-chain contract status enum: `Open, Claimed, Submitted, Completed, Cancelled, Expired, Disputed, Refunded`.

## 4. Soroban Contract Interface (MVP)

```rust
create_bounty(creator, asset, amount, deadline, metadata_hash) -> bounty_id
claim_bounty(bounty_id, developer)
submit_bounty(bounty_id, developer, submission_hash)
approve_bounty(bounty_id)          // creator only
release_payment(bounty_id)         // pays developer
cancel_bounty(bounty_id)           // creator, pre-claim
refund_bounty(bounty_id)           // expired/eligible
```

Contract state per bounty:

```text
Bounty { id, creator, developer, asset, amount, deadline, status, metadata_hash }
```

## 5. Security Rules

- The frontend must never determine whether money is released. The contract is the source of truth.
- Only the creator may approve. Only eligible actors may claim/submit.
- `amount > 0`, asset verified, deadline enforced, valid state transitions only.
- Never store private keys / seed phrases. Every financial action requires a wallet signature.
- The AI provider must never control escrow funds.

## 6. Asset Support

XLM (native) and Stellar USDC (verified issuer per network). Store `asset_code`, `asset_issuer`, `network`; verify before deposit.

## 7. Core Entities (off-chain metadata)

- **User**: wallet_address, github_username, reputation, completed/created bounties.
- **Bounty**: title, description, requirements, acceptance_criteria, reward, asset, deadline, status, github_repository, escrow_contract, escrow_id, claimed_by.
- **Submission**: bounty_id, developer, github_pr_url, commit_hash, status.
- **Transaction**: bounty_id, type (ESCROW_DEPOSIT|BOUNTY_RELEASE|REFUND), tx_hash, asset, amount, sender, recipient.

## 8. Database Rule

The database is NOT the source of truth for financial balances. Blockchain stores escrow state, asset, amount, creator, developer. Database stores descriptions, profiles, GitHub metadata, cached blockchain data. Every payment must be independently verifiable via transaction hash.

## 9. GitHub Verification

Verify PR exists AND belongs to expected repository AND author matches claimed developer. Merge status does NOT auto-release funds in v1 — the creator makes the final approval decision.

## 10. AI Assistant (advisory only)

AI helps draft bounty titles/requirements/acceptance criteria and can summarize a submission against requirements. AI recommendations are advisory. AI must NEVER create escrow, transfer, release, or refund funds.

## 11. Frontend Pages

`/`, `/bounties`, `/bounties/[id]`, `/create`, `/bounties/[id]/submit`, `/dashboard`, `/profile/[username]`.

## 12. API Routes

```text
POST /api/bounties          GET /api/bounties          GET /api/bounties/:id
POST /api/bounties/:id/claim   POST /api/bounties/:id/submit
POST /api/bounties/:id/approve  POST /api/bounties/:id/refund
GET  /api/github/repository     GET /api/github/pull-request
POST /api/ai/generate-bounty    POST /api/ai/analyze-submission
```

## 13. Repository Structure (target)

```text
stellar-forge/
├── apps/web/            # Next.js app (frontend + API routes)
├── contracts/bounty-escrow/   # Soroban escrow contract
├── packages/{stellar,database,github,ai}/
├── tests/  docs/  README.md  SPEC.md
```

## 14. Platform Fee

MVP: 0%. Any future fee must be implemented transparently in the smart contract, never hidden in the frontend.

## 15. MVP Success Criteria

A real creator deposits USDC into a Soroban escrow, a real developer claims and submits a GitHub PR, the creator approves, and the contract transfers the reward — with the full transaction history independently verifiable on Stellar.

## 16. Design Principles

1. Stellar first. 2. Blockchain only where trust matters (money/escrow/settlement). 3. AI is assistive, never controls money. 4. Human approval decides acceptance. 5. Every payment is a verifiable Stellar transaction. 6. Minimal MVP that proves real task + real developer + real escrow + real Stellar transaction.

## 17. Roadmap

- **V1**: Bounties + Soroban escrow + XLM/USDC + GitHub.
- **V2**: Milestones, multiple reviewers, reputation, notifications, org accounts.
- **V3**: AI code review, automated requirement checking, advanced disputes, teams.
- **V4**: Agentic bounties, AI agents, x402/MPP, machine-to-machine payments.

## One-Sentence Definition

> Stellar Forge is a Stellar-native developer bounty marketplace that uses Soroban smart contracts to escrow and automatically settle XLM or USDC rewards when software work is approved.
