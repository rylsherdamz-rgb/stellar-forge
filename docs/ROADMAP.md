# Stellar Forge — Roadmap (SCF Tranche-Aligned)

Tranche structure follows the SCF Build Award rules (handbook: github.com/stellar/scf-handbook): three tranches of deliverables, each with success criteria and a way for reviewers to verify completion. Tranche #2 includes the mandatory threat model + monitoring plan; Tranche #3 is the mainnet launch.

Current status: **Tranche #1 in progress** (core shipped, testnet evidence pending). The Instaward sprint (docs/INSTAWARD-SOW.md) executes the tranche-#1 thin slice.

## Tranche #1 — MVP (20%)

Goal: a developer installs the skill, scaffolds a project, and the workflow builds + evals on Stellar Testnet.

| Deliverable | Success criteria | Reviewer verification | Status |
|---|---|---|---|
| Framework 1.0: kernel graph engine, 6 agents, 5 eval suites | Scaffold → build → eval → testnet-deploy passes end-to-end | Repo CI green; clean-checkout `npm install && npm test` works | done |
| CLI + templates (contracts/frontend/backend/cicd) | Clean-environment scaffold works from docs alone | Fresh-environment reproduction | done |
| Testnet thin slice: reference contract + SDK interaction | Soroban contract builds, tests pass, deploys to testnet | Contract ID + tx hash in `data/deployments/testnet.json` | in progress (Instaward) |
| Eval suites run from a fresh checkout | `npm test` passes or skips gracefully | Test output in CI | done |

## Tranche #2 — Testnet Expansion (30%)

Goal: feature depth — payments, e2e harness, security readiness — all validated on testnet.

| Deliverable | Success criteria | Reviewer verification | Status |
|---|---|---|---|
| Testnet reference dApp (token contract + wallet UI + paid API via x402) | Deployed on testnet; contract ID + tx hashes captured | Explorer links + deployment registry | pending |
| E2E harness (local Stellar + Playwright + Agentic Kit hooks) | e2e suite runs in CI and locally | CI logs + badge | pending |
| Threat model + monitoring plan (STRIDE-aligned) | Threat model covering generated-code, credential, supply-chain, eval-bypass risks; monitoring metrics, emissions, triggers | Docs in repo (follows Stellar threat-modeling + monitoring templates) | pending |
| Clean-environment reproducibility + knowledge-graph (graphify) integration | Second developer reproduces workflow from clean setup | Reproduction video + graph output | pending |

## Tranche #3 — Mainnet Launch (40%)

Goal: production release with a mainnet-validated reference dApp and adoption materials.

| Deliverable | Success criteria | Reviewer verification | Status |
|---|---|---|---|
| Production release: v1.0 tag, npm publish, skills registry | `npx create-stellar-agentic` installs from npm | npm page + release tag | pending |
| Reference dApp live on mainnet (token + wallet + paid endpoint) | Mainnet contract deployed + activated; paid request served end-to-end | Explorer links + tx hashes + demo | pending |
| Docs site + onboarding guides + reproducible examples | Developer goes from docs to mainnet-validated app | Docs site + clean-setup run | pending |
| Community launch: adoption kit, contribution guide, monitoring live | Contribution guidelines + adoption tutorial; monitoring per tranche-2 plan | Repo + monitoring dashboard | pending |

## Tranche Deadlines

Each tranche submits within 90 days of the previous payment (SCF rule) — timeline: T1 by day 30 (Instaward completes), T2 by day 90, T3 by day 120.