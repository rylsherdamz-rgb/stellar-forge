# Threat Model — Stellar Forge

**Version:** 1.0 (2026-08-16) · **Scope:** Stellar Forge framework, Forge Gateway, scaffolded apps
**Method:** STRIDE per the Stellar threat-modeling guide (developers.stellar.org/docs/build/security-docs/threat-modeling)

## 1. Assets

| Asset | Where it lives | Value |
|-------|----------------|-------|
| Deployer/stellar secret keys | `.env` (kernel-owned, git-ignored) | Critical — controls deployed contracts, funds |
| Deployed contract registry | `data/deployments/*.json` (tracked) | High — onchain identity of all shipped contracts |
| Payment wallet config (x402/MPP) | `.env` (OZ_API_KEY, MPP vars) | High — receives USDC settlement |
| Agent system prompts + skills | `agents/`, `skills/` (tracked) | Medium — prompt-injection surface |
| Evals/verifier criteria | `evals/*.md` (tracked) | Medium — if tampered, bad code ships |
| Gateway catalog + sandbox | `packages/forge-gateway/` | Medium — executes third-party agent code |
| USDC/contract IDs in frontend | `.env` (`NEXT_PUBLIC_*`) | Low — public by design, but wrong values break app |
| CI secrets (npm token, Vercel token) | GitHub secrets | High — supply-chain pivot |

## 2. Trust boundaries

```
[User/agent prompt] ──▶ [Kernel (graph engine)] ──▶ [6 specialist agents]
                                        │
                   ┌────────────────────┼────────────────────┐
                   ▼                    ▼                    ▼
          [Contract code]        [Backend/API]         [Gateway /mcp sandbox]
                   │                    │                    │
                   ▼                    ▼                    ▼
              [Soroban chain]      [RPC/Horizon]        [Agent-executed JS]
```

Trust boundaries: (B1) agent output → repo files; (B2) agent output → `.env`/deployments (kernel-only writes); (B3) third-party agent code → Gateway sandbox; (B4) contract code → chain; (B5) CI → published artifacts.

## 3. STRIDE analysis

### 3.1 Spoofing
| Threat | Likelihood | Impact | Mitigation |
|--------|-----------|--------|------------|
| Impersonated MCP client calls gateway `execute` | Med | Low | Optional bearer token (`FORGE_GATEWAY_TOKEN`) enforced on `/mcp` + `/api/execute`; open mode only for dev |
| Fake contract ID in `.env` misdirects frontend | Med | Med | `.env` is kernel-owned; only deploy scripts write it; deploys record WASM hashes in `data/deployments/` for cross-check |
| Spoofed friendbot/testnet key | Low | Low | Testnet-only values are low-value; mainnet keys never in repo (git-ignored `.env`) |
| Impersonated Stellar RPC endpoint | Med | Med | RPC URL pinned in `.env`; monitoring plan checks RPC health; TLS enforced |

### 3.2 Tampering
| Threat | Likelihood | Impact | Mitigation |
|--------|-----------|--------|------------|
| Agent edits evals to pass its own output | Med | High | Evals are kernel-verified against fixed criteria; eval files git-tracked, changes reviewed; verifier runs independent of the producing agent |
| `.env` edited by two agents concurrently | Med | High | Kernel-only write policy; fan-in merge is the single writer |
| Contract WASM tampered before deploy | Low | High | `cargo build` from source at deploy time; WASM hash recorded and re-verifiable (`stellar contract deploy` returns the hash) |
| Gateway catalog poisoned via repo scan | Med | Med | Catalog sources are tracked repo files; curated entries are code-reviewed |
| Agent injects code into prompt/skill files | Med | Med | Skills/agents tracked; review gate on changes; sandbox blocks execution-time injection vectors |

### 3.3 Repudiation
| Threat | Likelihood | Impact | Mitigation |
|--------|-----------|--------|------------|
| No record of which agent produced which file | High | Med | Work-graph JSON (`data/graphs/<task>.json`) records node → agent → status; session logs append-only |
| Deploy without audit trail | Med | Med | `data/deployments/<network>.json` records network, deployer, contract ID, WASM hash, timestamp |
| Undefined blame for failed eval | Med | Low | Graph state machine records retries/reroutes per node; eval reports per wave |

### 3.4 Information disclosure
| Threat | Likelihood | Impact | Mitigation |
|--------|-----------|--------|------------|
| Secrets leaked into git | Med | High | `.env` git-ignored; `data/logs/` ignored; agent files forbid hardcoded credentials (CLAUDE.md policy); CI scans for keys |
| Gateway sandbox exfiltrates catalog data | Low | Low | Sandbox has no network (`fetch`/`require`/`process` blocked); only catalog API exposed; results serialized |
| RPC/API keys exposed in frontend bundle | Med | Med | Only `NEXT_PUBLIC_*` (public) values reach the client; server-only keys stay in backend `.env` |
| Deployer key leaked via logs | Low | High | Deploy scripts never echo keys; logging level guidance in `.env.example` |

### 3.5 Denial of service
| Threat | Likelihood | Impact | Mitigation |
|--------|-----------|--------|------------|
| Runaway sandbox code (infinite loop) | High | Low | 2s vm timeout + 100 KB code cap; test-enforced |
| Contract storage growth (TTL rent) | Med | Med | Vault template extends TTL on every write (CAP-74); state kept minimal (no unbounded lists) |
| Gateway flooded with requests | Med | Med | Stateless per-request transports; deploy behind reverse proxy with rate limit (ops zone) |
| RPC rate-limit exhaustion during e2e | Med | Low | Tests share one funded account; runs on testnet |

### 3.6 Elevation of privilege
| Threat | Likelihood | Impact | Mitigation |
|--------|-----------|--------|------------|
| Agent escalates to write `.env`/deployments | Med | High | Kernel-only file ownership; agents get zone-scoped paths only (Work Contract) |
| Sandbox escapes to host process | Low | High | `node:vm` best-effort; production deploys should add `--experimental-permission` or OS sandbox; documented in gateway README |
| Contract auth bypass (non-owner claims) | Low | High | `require_auth` on every privileged fn; auth failure tests in vault/hello-world/token test suites |
| CI secret used to publish malicious package | Low | High | npm publish gated on eval pass; package contents generated from tracked templates |

## 4. Attack trees (top 2)

### A. Steal deployer key via agent prompt injection
```
Attacker crafts prompt → agent writes key to tracked file or echo in logs
  ├─ [1] Agent writes into kernel-owned .env          → blocked: kernel-only write policy
  ├─ [2] Agent bakes key into frontend bundle         → blocked: NEXT_PUBLIC_* whitelist
  ├─ [3] Agent logs key in session log                → blocked: logs git-ignored + append-only
  └─ [4] Agent commits key                            → detected: CI secret scan + PR review
```

### B. Compromise gateway sandbox
```
Agent code → escape node:vm → host access
  ├─ [1] require/fetch/process/globalThis             → blocked: deny-list regex pre-scan
  ├─ [2] Constructor-chain escape via host functions  → mitigated: catalog API is the only host surface;
  │                                                     production deploys run --experimental-permission
  └─ [3] Infinite loop                                → blocked: 2s timeout
```

## 5. Assumptions
- Soroban RPC and Horizon are trusted infrastructure (TLS, official endpoints).
- `.env` is never committed; all CI credentials live in GitHub secrets.
- Mainnet deploys require explicit human approval (deploy script prompts after testnet).
- The six specialist agents are cooperative; the graph's contract restricts, not adversarial-hardens, them.

## 6. Outstanding risks (tracked)
- [ ] Production-grade sandbox isolation (worker + permission model) before multi-tenant gateway hosting.
- [ ] Secret scanning in CI on push (add `gitleaks` step to ci.yml).
- [ ] Dependency pinning policy for scaffold templates (currently caret ranges).

_Reviewed against: Stellar threat-modeling guide; SCF tranche #2 requirement._