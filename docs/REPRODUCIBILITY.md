# Reproducibility Guide — Stellar Forge

Every claim in this repo is re-runnable in a clean environment. Verified 2026-08-16 on Node v26.5.0, stellar CLI 27.0.0, Rust stable.

## 1. Prerequisites

```bash
node >= 20          # node v26.5.0 verified
npm >= 10
git
rustup + wasm32v1-none target   # for contracts: rustup target add wasm32v1-none
stellar-cli >= 27  # https://github.com/stellar/stellar-cli (v27.0.0 verified)
```

## 2. Install & verify the framework

```bash
git clone https://github.com/rylsherdamz-rgb/stellar-forge.git
cd stellar-forge
npm install                     # workspaces: create-stellar-agentic, forge-gateway, frontend, backend, tests
npm test                        # contract-state suite (x402/mpp suites need a running backend — see §4)
npm test -w forge-gateway       # 10 gateway tests: catalog, search ranking, sandbox blocking, auth, health
node packages/create-stellar-agentic/index.mjs --help   # scaffold CLI works
npm run validate                # skill/marketplace manifest validation
```

## 3. Catalog & live-service checks

```bash
npm run gateway:check-live      # probes Soroban testnet RPC, Horizon, npm registry, docs site, GitHub
npm run gateway                 # start Forge Gateway on :8787
# → playground http://localhost:8787/playground
# → MCP endpoint POST /mcp (streamable HTTP; initialize/tools/list/tools/call verified)
```

## 4. Run the payment test suites (x402 + MPP)

```bash
cp .env.example .env            # fill testnet wallet values
cd templates/backend && npm install && npm run dev   # server on :3001
cd ../../tests && BACKEND_URL=http://localhost:3001 node run.mjs
# expect: contract-state ✓, x402-flow ✓, mpp-charge-flow ✓
```

## 5. Deploy a contract to testnet (evidence pipeline)

```bash
cd templates/contracts
cargo test --manifest-path hello-world/Cargo.toml   # host tests gate the deploy
cargo build --release --target wasm32v1-none --manifest-path hello-world/Cargo.toml
stellar keys generate forge-deployer --network testnet
curl "https://friendbot.stellar.org?addr=$(stellar keys address forge-deployer)"   # fund (public testnet, no secrets)
stellar contract deploy --wasm hello-world/target/wasm32v1-none/release/hello_world.wasm \
  --source-account forge-deployer --network testnet
# → contract ID; record it in data/deployments/testnet.json + .env NEXT_PUBLIC_*_CONTRACT_ID
```

Automated: `scripts/deploy-contract.sh` wraps steps 2–6 (cargo-test gate → deploy → registry write).

## 6. Reproduce any claim

| Claim | Reproduce via |
|-------|---------------|
| 6-agent work graph runs in parallel waves | `CLAUDE.md` Phase 0–2; graph state in `data/graphs/` |
| Evals gate agent output | `evals/*.md` + `npm test` |
| Gateway serves search + sandboxed execute | §3; unit tests in `packages/forge-gateway/test/` |
| Payment templates work | §4 (verified 1 pass / 2 suite-ready) |
| Contracts deploy + record onchain | §5 |
| Security posture | `docs/THREAT-MODEL.md` + `docs/MONITORING-PLAN.md` |
| Market positioning | `docs/MARKET-ANALYSIS.md` |

## 7. Version pins (verified against npm registry 2026-08-16)

- `@stellar/stellar-sdk@^15.1.0` (backend), `^12` (frontend template) — do not bump blindly
- `@stellar/mpp@^0.7.1` + `mppx@^0.6.29` (MPP requires SDK 15.x — registry peer constraint)
- `@x402/express@^2`, `@x402/core@^2`, `@x402/stellar@^2` (nested SDK 16.x, isolated)
- `soroban-sdk@27.0.0-rc.1` (contracts), `@modelcontextprotocol/sdk@^1.30.0` (gateway)

## 8. Environment variables

`.env.example` is the source of truth (testnet RPC, Horizon, wallet keys, OZ_API_KEY, MPP channel config, contract IDs). Testnet friendbot keys are public-fundable and safe to create per run — never commit funded mainnet keys.