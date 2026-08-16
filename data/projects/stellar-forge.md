# Project: stellar-forge

- **Created:** 2026-07-29
- **Type:** full (skill + CLI + templates + evals + docs site)
- **Status:** MVP working on testnet path; SCF Build Award application in draft (docs/scf/SCF-BUILD-AWARD.md, Open Track); tranche #2 security docs + Forge Gateway shipped ahead of schedule
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
- [ ] Testnet deployment evidence (contract ID + tx hashes in `data/deployments/testnet.json`)
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
| Deployment registry | data/deployments/ (testnet.json empty) | pending testnet run |
| Promo video | media/promo.mp4 | exists |
| Instaward SOW | docs/INSTAWARD-SOW.md | drafted |

## Next Actions

- [ ] Run the Instaward sprint (start 2026-08-17 per SOW): testnet thin slice, deployment evidence
- [ ] Record first testnet contract ID in `data/deployments/testnet.json`
- [ ] Deploy a real contract to testnet (friendbot key) + capture tx hash evidence
- [ ] Run x402/MPP suites against a live local backend for passing evidence
- [ ] Update SCF application with real Instaward results before submission