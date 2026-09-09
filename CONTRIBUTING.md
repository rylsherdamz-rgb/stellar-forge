# Contributing

Thanks for your interest in Stellar Forge — a Stellar-native developer bounty &
escrow marketplace. This document covers how to contribute effectively.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Branch Model](#branch-model)
- [Getting Started](#getting-started)
- [Working on the Contract](#working-on-the-contract)
- [Working on the App](#working-on-the-app)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Be respectful, constructive, and inclusive.

## Branch Model

```
dev  ──PR──▶  staging  ──PR──▶  master
```

| Branch | Direct pushes | Purpose |
|--------|--------------|---------|
| `dev` | ✅ allowed | Active development. Commit often, push freely. |
| `staging` | ❌ PRs only | Integration testing. CI must pass before merge. |
| `master` | ❌ PRs only, admin-enforced | Production. Never push directly. |

**Never push directly to `master`.** All changes arrive via pull request.

## Getting Started

```bash
git clone https://github.com/rylsherdamz-rgb/stellar-forge.git
cd stellar-forge
```

You will need the [Stellar CLI](https://developers.stellar.org/docs/tools/cli)
(`stellar`), a Rust toolchain with the `wasm32v1-none` target, and Node.js for the
web app.

## Working on the Contract

The escrow contract lives in [`contracts/bounty-escrow`](contracts/bounty-escrow).
It owns the full bounty state machine — treat it as the source of truth for money.

```bash
# run the full test suite before every PR
cargo test --manifest-path contracts/bounty-escrow/Cargo.toml

# build the optimized wasm
stellar contract build --manifest-path contracts/bounty-escrow/Cargo.toml

# deploy to your own testnet identity for manual testing
stellar contract deploy \
  --wasm contracts/target/wasm32v1-none/release/bounty_escrow.wasm \
  --source <your-identity> --network testnet
```

**Contract rules for contributors:**

- Every privileged function must call `require_auth` on the correct actor.
- Never move funds outside a valid state transition.
- Add a test for every new state transition **and** its failure/auth cases.
- Keep `overflow-checks = true`; validate `amount > 0` and deadlines.
- Record any new testnet deployment in `data/deployments/testnet.json`.

## Working on the App

The Next.js app (frontend + API routes) is being built in `apps/web/` per
[SPEC.md](SPEC.md). Guidelines:

- The frontend never decides whether money moves — always call the contract.
- Never request or store private keys / seed phrases; sign via Stellar Wallets Kit.
- Verify assets (code + issuer + network) before any deposit.
- The database stores metadata only; every financial event must be verifiable by
  its Stellar transaction hash.
- The AI assistant is advisory — it may draft bounties or summarize submissions, but
  it must never create escrow, transfer, release, or refund funds.

## Pull Request Process

1. Keep PRs focused — one feature or fix per PR.
2. Reference the issue the PR closes (`Closes #NN`).
3. For contract changes, include the passing `cargo test` output in the PR body.
4. Update docs (`SPEC.md`, `README.md`, `SECURITY.md`) if you change behavior.
5. Get at least one review before merge.

### PR Title Format

```
feat: add X capability
fix: correct Y behavior
docs: update Z
refactor: restructure A
```

## Release Process

1. PR `staging` → `master` (CI gates apply).
2. Tag on `master`: `git tag v<semver> && git push origin v<semver>`.
3. The site deploys via Vercel's Git integration.

## Questions

Open a [Discussion](https://github.com/rylsherdamz-rgb/stellar-forge/discussions) or file an [Issue](https://github.com/rylsherdamz-rgb/stellar-forge/issues/new/choose).
