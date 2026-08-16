# Monitoring Plan — Stellar Forge

**Version:** 1.0 (2026-08-16) · **Scope:** repo health, CI, gateway service, testnet deployments
**Based on:** Stellar monitoring template for builders (developers.stellar.org/docs/build/security-docs/monitoring/monitoring-template-builders)

## 1. What we monitor

| System | What to watch | Why |
|--------|---------------|-----|
| Soroban testnet RPC | Health, ledger latency | All contract interaction depends on it |
| Horizon (testnet) | Health, sync | Classic asset/account queries |
| npm registry | `create-stellar-agentic` latest version | Published template drift detection |
| Docs site (vercel) | HTTP 200, deploy status | Public surface for SCF reviewers |
| GitHub repo | CI status, secret exposure | Supply-chain + integrity |
| Gateway service | `/health`, catalog size, uptime | Product surface (SCF evidence) |
| Deployed contracts | WASM hash vs `data/deployments/` record | Tamper detection onchain |

## 2. How we check (automated)

**`packages/forge-gateway/scripts/check-live.mjs`** — daily (external cron), probes all 5 external services and exits non-zero if any is down:

```bash
npm run gateway:check-live   # → JSON report, exit code 0/1
```

Checks: Soroban testnet RPC `getHealth`, Horizon `/`, npm registry latest, docs site, GitHub repo API. Run via external cron (systemd timer / CI scheduled workflow), per framework policy — never session-bound.

**CI (`npm test`)** — every push: gateway unit tests (10), framework `tests/run.mjs` (contract-state, x402-flow, mpp-charge-flow), cargo contract tests.

## 3. Metrics & thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| RPC health | fail > 2 consecutive checks | Alert; retest with alternate endpoint from `.env.example` |
| CI test pass rate | < 100% on main | Block merge; rerun suite; escalate to ops agent |
| Gateway catalog size | drops below 50 entries | Rebuild catalog; check repo scan paths |
| Gateway uptime | < 99% (rolling 30d) | Review hosting; add rate limiting |
| Deployed contract hash drift | hash ≠ registry | Assume tampering; redeploy from source; audit keys |
| Eval pass rate (wave verifier) | < 90% across tasks | Review graph routing; steer/reroute pattern |

## 4. Alerting

| Severity | Channel | Example |
|----------|---------|---------|
| Critical | GitHub issue + email | Deployer key leak, contract hash drift, mainnet funds movement |
| High | GitHub issue | CI red on main, RPC down > 2 checks, sandbox escape report |
| Medium | PR comment | Catalog drift, dependency deprecation warnings |
| Low | Session log | Version bumps, eval flakiness |

## 5. Incident response (contained recovery)

1. **Contain:** stop deploys (deploy script gate), rotate `.env` secrets if suspected, revert offending commit.
2. **Diagnose:** read append-only session logs + graph JSON; replay failing eval.
3. **Recover:** redeploy from tracked source; record new WASM hash in `data/deployments/`; update ADR if policy changed.
4. **Post-mortem:** append `data/logs/reflections/`; open follow-up inbox ticket.

## 6. Maintenance cadence

- Daily: `check-live.mjs` (cron)
- Per push: CI test suite + lint
- Weekly: review `data/deployments/` hash integrity vs chain, review cost logs
- Monthly: dependency audit (`npm audit`), eval criteria review, threat model refresh

## 7. Ownership

| Zone | Responsible |
|------|-------------|
| CI + deploys | @stellar-ops |
| Contract onchain state | @stellar-contracts |
| Gateway service | kernel (repo owner) |
| RPC/Horizon availability | kernel escalation to ecosystem status page |

_Reviewed against: Stellar monitoring template; SCF tranche #2 requirement._