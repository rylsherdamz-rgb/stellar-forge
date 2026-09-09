# Reproducibility — Stellar Forge Bounty Escrow

This guide lets a new developer reproduce the full bounty lifecycle from a clean
environment, validated on Stellar Testnet. It satisfies the Instaward SOW
"Reproducibility" and "Acceptance Criteria" sections.

## Prerequisites

| Tool | Version used |
|---|---|
| Rust + `wasm32v1-none` target | rustc 1.96 |
| Stellar CLI (`stellar`) | 27.0.0 |
| Node.js | ≥ 20 |
| A funded Testnet identity | `stellar keys generate <name> && stellar keys fund <name> --network testnet` |

## 1. Contract — build, test, deploy

```bash
# unit tests (17: happy path, auth, double-claim, unauthorized, expiry, zero reward, ...)
cargo test --manifest-path contracts/bounty-escrow/Cargo.toml

# build the optimized wasm
stellar contract build --manifest-path contracts/bounty-escrow/Cargo.toml

# deploy to testnet
stellar contract deploy \
  --wasm contracts/target/wasm32v1-none/release/bounty_escrow.wasm \
  --source <name> --network testnet
# → prints the contract id; record it in data/deployments/testnet.json

# initialize with an admin
stellar contract invoke --id <CONTRACT_ID> --source <name> --network testnet \
  -- initialize --admin $(stellar keys address <name>)
```

The reference deployment (already live) is recorded in
[`data/deployments/testnet.json`](../data/deployments/testnet.json):
`CCUG6LFKZLTYX7R2KVHAT5ZGWT54CZFJ5SMEYMSUPMLPHASYOWONLKZU`.

## 2. Packages — verification units

```bash
npm install                 # workspaces: apps/web, packages/github, packages/stellar
npm test                    # github PR verification (9) + wallet/asset (7)
```

## 3. Web application

```bash
cp apps/web/.env.example apps/web/.env.local   # defaults already target testnet
npm run build -w @stellar-forge/web            # production build
npm run dev  -w @stellar-forge/web             # http://localhost:3000
```

## 4. Full lifecycle (UI, on Testnet)

1. **Connect wallet** (top-right) with a Testnet-funded account via Stellar Wallets Kit.
2. **Create & fund** at `/create`: fill in title/description/requirements/acceptance
   criteria/repo/reward (XLM)/deadline, then sign. The reward is deposited into the
   escrow — the `create_bounty` tx hash is captured.
3. **Browse** at `/bounties`; open the detail page and confirm the escrow id + OPEN status.
4. **Claim** as a different developer wallet (`claim_bounty`).
5. **Submit proof** at `/bounties/[id]/submit` with a GitHub PR URL + your GitHub
   login. Forge verifies the PR (repo + author) and records `submit_bounty`.
6. **Approve & pay** as the creator (`approve_bounty`) — the contract releases the
   XLM to the developer. The tx hash links to stellar.expert.
7. **Refund path**: create another bounty, let its deadline pass (or `cancel` while
   OPEN), then `refund_bounty` / `cancel_bounty` returns the XLM to the creator.

Every financial step surfaces a transaction hash with a stellar.expert link, so the
whole lifecycle is independently verifiable on-chain.

## Verification matrix (SOW §7.2)

| Control | Where |
|---|---|
| Wallet connection | Nav → Connect Wallet |
| Contract deployment | step 1 |
| Creation + deposit | `/create` → `create_bounty` |
| Listing + detail retrieval | `/bounties`, `/bounties/[id]` |
| Claim | detail → Claim (`claim_bounty`) |
| Double-claim rejected | contract test `double_claim_rejected` |
| PR submission capture | `/bounties/[id]/submit` + `verifySubmission` |
| Approval + release | detail → Approve & Pay (`approve_bounty`) |
| Unauthorized approval rejected | contract test `approve_before_submit_rejected` / auth checks |
| Refund / expiry path | detail → Refund/Cancel (`refund_bounty`/`cancel_bounty`) |
| Insufficient-funds / invalid-state rejected | contract tests + on-chain guards |
| Build + integration success | `cargo test`, `npm test`, `npm run build -w @stellar-forge/web` |
