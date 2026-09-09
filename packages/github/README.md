# Stellar Forge — Wallet + GitHub Integration

The two vital trust anchors of Stellar Forge:

1. **Stellar Wallets Kit** signs every financial action. Forge never sees a
   private key or seed phrase — the wallet holds the keys, the contract holds
   the funds.
2. **GitHub** is the proof-of-work anchor. A bounty is only eligible for
   on-chain approval once a real Pull Request — in the expected repo, authored
   by the claiming developer — is verified.

```
Developer                     Forge                         Chain / GitHub
   │  connect wallet            │                                │
   │ ─────────────────────────▶ │  ForgeWallet.connect()         │
   │                            │  (Stellar Wallets Kit modal)   │
   │  claim bounty              │ ── claim_bounty (signed) ─────▶ │ Soroban
   │  open PR on GitHub         │                                │
   │  submit PR url ──────────▶ │  verifySubmission() ─────────▶ │ GitHub API
   │                            │   • PR exists                  │
   │                            │   • repo matches               │
   │                            │   • author == developer        │
   │                            │ ── submit_bounty (signed) ────▶ │ Soroban
Creator                        │                                │
   │  review + approve ───────▶ │  approve_bounty (signed) ─────▶ │ Soroban
   │                            │   contract transfers reward    │
```

## Wallet: `@stellar-forge/stellar`

```js
import { StellarWalletsKit, WalletNetwork, allowAllModules } from "@creit.tech/stellar-wallets-kit";
import { ForgeWallet, assertVerifiedAsset, METHODS } from "@stellar-forge/stellar";

const kit = new StellarWalletsKit({
  network: WalletNetwork.TESTNET,
  modules: allowAllModules(),
});
const wallet = new ForgeWallet(kit);
await wallet.connect();                       // opens the wallet selector

assertVerifiedAsset("testnet", "USDC");        // reject unverified assets before deposit
const signedXdr = await wallet.signTransaction(txXdr, networkPassphrase);
```

- The frontend assembles a contract-invocation transaction (e.g. `METHODS.CREATE`)
  and asks the wallet to sign it. **The frontend never decides whether funds move.**
- `assertVerifiedAsset` gates deposits to XLM and the canonical USDC issuer per
  network (SPEC.md §17).

## GitHub verification: `@stellar-forge/github`

```js
import { verifySubmission } from "@stellar-forge/github";

const result = await verifySubmission(
  {
    prUrl: "https://github.com/alice/project/pull/42",
    expectedRepo: "alice/project",       // from the bounty
    expectedGithubLogin: "bob",          // the claiming developer
  },
  { token: process.env.GITHUB_TOKEN },   // optional, raises rate limits
);

// result.verified === true only when the PR exists AND is in the expected repo
// AND the author matches the claimed developer.
// result.checks.merged is reported but does NOT auto-release funds (v1).
```

Wire it into `POST /api/bounties/:id/submit`: verify **before** the developer's
`submit_bounty` transaction is accepted, and surface `result.reasons` to the
creator so a human makes the final, wallet-signed approval decision.

## Why this split matters

- **Wallet Kit** keeps key custody with the user and turns "approve" into a
  cryptographic signature the contract can authorize against.
- **GitHub** turns "the work is done" into an objective, third-party-checkable
  fact — without it, a bounty is just a promise. It is the single most important
  verification surface in the product, which is why it is a dedicated, tested
  package rather than inline glue code.

Both are covered by unit tests (`node --test`) and never touch escrow funds
directly — the Soroban contract remains the source of truth.
