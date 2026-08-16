# Project: stellar-forge

- **Created:** 2026-07-29
- **Type:** full (skill + CLI + templates + evals + docs site)
- **Status:** MVP working on testnet; Forge Vault deployed to testnet (CB2JGIN...SHKFZ) with 3/3 live framework suites passing; SCF Build Award application in draft (docs/scf/SCF-BUILD-AWARD.md, Open Track); tranche #2 security docs + Forge Gateway shipped ahead of schedule
- **Repo:** https://github.com/rylsherdamz-rgb/stellar-forge
- **npm:** create-stellar-agentic
- **Site:** https://stellar-agentic-framework.vercel.app
- **License:** MIT

## Funding & Programs

| Program | Status | Scope |
|---|---|---|
| Instaward (Philippines chapter) | SOW drafted (docs/INSTAWARD-SOW.md), $5,000, 30-day sprint | MIT skill + CLI + testnet-validated reference project |
| SCF Build Award (Open Track) | Draft application (docs/scf/SCF-BUILD-AWARD.md), $30,000, 4 months | Production release + mainnet-validated reference dApps |

## Milestones

- [x] Framework core: kernel graph engine, 6 agents, 5 eval suites, 10 skills
- [x] CLI (`create-stellar-agentic`) with skill install + scaffold
- [x] Templates: contracts / frontend / backend / cicd
- [x] Eval suites run: contract-state ✓, x402/mpp skip gracefully without live backend (tests/package.json added, root `npm install` verified)
- [x] Docs site deployed (Vercel)
- [x] Threat model + monitoring plan (tranche #2 requirement) — docs/THREAT-MODEL.md, docs/MONITORING-PLAN.md
- [x] Market analysis + reproducibility guide (Open Track requirements) — docs/MARKET-ANALYSIS.md, docs/REPRODUCIBILITY.md
- [x] Forge Gateway (Raven-style remote Stellar-context MCP server) — packages/forge-gateway, 10/10 tests, live-service checks all passing
- [x] CI runs gateway + framework tests on every push (.github/workflows/ci.yml)
- [x] Forge Vault contract: milestone escrow, 9/9 tests, WASM 21,562 B
- [x] Testnet deployment evidence: vault live at CB2JGINPQP6DSWEY6N5XOWOSVOW6IPCNLSM2AQWVKP3LTVSQ3SQSHKFZ, `total_committed` invoke verified via public RPC
- [x] x402 + MPP + contract-state suites green against live backend + testnet RPC (3/3)
- [ ] Mainnet reference dApp
- [ ] SCF Build Award submission

## Evidence Registry (for SCF review)

| Evidence | Location | Status |
|---|---|---|
| Public repo (MIT) | github.com/rylsherdamz-rgb/stellar-forge | live |
| CLI package | npm: create-stellar-agentic | published v0.2.0 |
| Install verification | `npm install` + `npm test` from clean checkout | verified 2026-08-16 |
| Eval suites | tests/ (run.mjs, x402-flow, mpp-charge-flow, contract-state) | pass/skip-graceful |
| Gateway unit tests | packages/forge-gateway/test (10 tests) | pass 2026-08-16 |
| Live-service checks | `npm run gateway:check-live` — Soroban RPC, Horizon, npm, docs site, GitHub | all up 2026-08-16 |
| Threat model (STRIDE) | docs/THREAT-MODEL.md | done (tranche 2.3) |
| Monitoring plan | docs/MONITORING-PLAN.md | done (tranche 2.3) |
| Market analysis | docs/MARKET-ANALYSIS.md | done (Open Track) |
| Reproducibility guide | docs/REPRODUCIBILITY.md | done |
| Deployment registry | data/deployments/testnet.json | vault deployed 2026-08-16 (CB2JGIN...SHKFZ) |
| Framework suite (live) | tests/run.mjs against backend :3001 + testnet RPC | 3/3 pass 2026-08-16 (ledger #4171049) |
| Vault contract tests | templates/contracts/vault — cargo test | 9/9 pass 2026-08-16 |
| Vault on-chain | invoke total_committed via stellar CLI, testnet | returns "0" (read-only, verified) |
| Promo video | media/promo.mp4 | exists |
| Instaward SOW | docs/INSTAWARD-SOW.md | drafted |

## Next Actions

- [ ] Run the Instaward sprint (start 2026-08-17 per SOW): testnet thin slice, full deployment evidence (tx hashes)
- [ ] Initialize + exercise the vault on testnet (deposit → claim) with real USDC SAC for end-to-end evidence
- [ ] Update SCF application with real Instaward results before submission