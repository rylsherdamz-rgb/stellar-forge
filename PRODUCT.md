# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two sides of a software-work marketplace. **Bounty creators**: open-source maintainers, startups, DAOs, hackathon organizers, and developers who need discrete software tasks done (bug fixes, docs, components, contracts, integrations, tests). **Developers**: engineers who want to earn XLM or USDC by completing funded tasks. Secondary: the Stellar ecosystem evaluating a real programmable-payments use case. They arrive from GitHub, X, and the promo video and decide within seconds whether escrowed, on-chain-settled bounties beat trust-based bounty boards.

## Product Purpose

Stellar Forge is a Stellar-native developer bounty & escrow marketplace. A creator posts a funded bounty; the reward is escrowed in a Soroban smart contract; a developer claims it, does the work, and submits a GitHub Pull Request; the creator approves; the contract releases the reward directly to the developer's Stellar wallet. Success is a real task funded, completed, approved, and settled on Stellar — with the whole history independently verifiable on-chain.

## Positioning

Trust-based bounty boards separate payment from proof of work: developers don't know a reward is funded, and creators hesitate to pay before seeing results. Stellar Forge fuses reward + verification into one programmable agreement. The reward is escrowed on creation, so every open bounty is provably funded, and funds only move on an authorized, on-chain state transition — "the blockchain controls the money, not the frontend."

## Operating Context

Users are developers and technical creators: wallets, GitHub, PRs, testnet, and transaction hashes matter. Core verbs: connect wallet, create + fund bounty, browse, claim, submit PR, approve & pay, refund. A promo video (media/promo.mp4) demonstrates the flow. The escrow contract is deployed and initialized on Stellar Testnet.

## Capabilities and Constraints

- Soroban escrow contract (`contracts/bounty-escrow`): `create_bounty`, `claim_bounty`, `submit_bounty`, `approve_bounty`, `release_payment`, `cancel_bounty`, `refund_bounty`, plus read views. Full state machine: Open → Claimed → Submitted → Completed, with Cancelled/Expired/Disputed/Refunded paths.
- Assets: XLM and Stellar USDC (verified issuer per network); asset verified before deposit.
- Auth: Stellar wallet (primary), optional GitHub OAuth. Never stores private keys.
- GitHub verification: PR exists, belongs to the expected repo, author matches the claimed developer. Merge status does NOT auto-release funds in v1.
- AI assistant is advisory only — drafts bounties, summarizes submissions; never controls funds.
- Database (Supabase/Postgres) stores metadata only; blockchain is the source of truth for funds.
- MIT licensed. Repo: github.com/rylsherdamz-rgb/stellar-forge.

## Brand Commitments

- Name: **Stellar Forge**. Logo: violet node-graph mark (favicon.svg) on dark ground.
- Tone: technical, precise, credible — a developer tool, not hype.
- Tagline: "Fund software work. Build software. Get paid on Stellar."

## Evidence on Hand

- Escrow contract deployed + initialized on Stellar Testnet: `CCUG6LFKZLTYX7R2KVHAT5ZGWT54CZFJ5SMEYMSUPMLPHASYOWONLKZU` (see `data/deployments/testnet.json`).
- 17 passing contract unit tests covering happy path, auth, and every failure transition.
- SPEC.md documents the full product; README.md documents the contract and flow.
- No testimonials, customer logos, benchmarks, or pricing exist; must not be fabricated.

## Product Principles

1. Stellar first — settlement and escrow are essential, not decorative.
2. Blockchain only where trust matters: money, escrow, settlement, financial state.
3. AI is assistive — it improves the workflow but never controls money.
4. Human approval — a person decides whether work is accepted.
5. Verifiable payments — every reward is a verifiable Stellar transaction.
6. Minimal MVP — prove real task + real developer + real escrow + real Stellar settlement.

## Accessibility & Inclusion

Dark, low-glare developer-facing UI; WCAG AA contrast, keyboard navigable, reduced-motion support.
