---
name: assets
description: >
  Stellar classic assets, trustlines, and Stellar Asset Contract (SAC) bridge
  to smart contracts. Covers issuance, distribution, authorization flags,
  clawback, regulated assets, and SEP-41 token interop. Use when tokenizing
  real-world assets, issuing stablecoins, managing trustlines, or bridging
  classic assets to Soroban contracts.
version: 0.2.0
author: rylsherdamz-rgb
tags:
  - stellar
  - assets
  - trustlines
  - sac
  - token
  - sep-41
---

# Assets (Classic + SAC)

## When to Use
- Issuing a Stellar classic asset (token)
- Setting up trustlines for distribution
- Configuring authorization flags (revocable, clawback-enabled)
- Bridging a classic asset to Soroban via SAC
- Reading trustline balances from the ledger

## Key Concepts

### Classic Assets
Issued on Stellar network with `ChangeTrust` + `Payment` operations. Controlled by asset issuer flags.

| Flag | Description |
|------|-------------|
| `AUTHORIZATION_REQUIRED` | Trustlines must be approved by issuer |
| `AUTHORIZATION_REVOCABLE` | Issuer can freeze/revoke trustlines |
| `AUTHORIZATION_CLAWBACK_ENABLED` | Issuer can clawback sent assets |

### SAC (Stellar Asset Contract)
Bridges classic assets to Soroban smart contracts as SEP-41 tokens. Each classic asset has a corresponding SAC contract ID.

### Trustlines
Required for users to hold non-native assets. Managed via `ChangeTrustOp` in classic or SAC `deposit`/`withdraw` methods.

## Strict Rules
1. Classic asset flags must be set at issuance — cannot be added later
2. SAC contract IDs are deterministic from the asset and network passphrase
3. Use `useStellarData().getBalances()` to read trustline balances — no raw RPC
