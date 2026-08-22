---
name: standards
description: >
  Stellar Ecosystem Proposals (SEPs), Core Advancement Proposals (CAPs), and
  ecosystem references. Use when implementing wallet integration, anchor
  services, KYC flows, deposit/withdrawal, or any SEP/CAP-based feature.
version: 0.2.0
author: rylsherdamz-rgb
tags:
  - stellar
  - standards
  - sep
  - cap
  - wallet
  - anchor
  - kyc
---

# Standards (SEPs + CAPs)

## When to Use
- Connecting a wallet via Stellar Wallets Kit
- Implementing SEP-10 (stellar.toml) for anchors
- Building KYC flow with SEP-12
- Handling deposits/withdrawals with SEP-6/SEP-24
- Using a SEP-41 token contract

## Key SEPs

| SEP | Purpose |
|-----|---------|
| SEP-1 | stellar.toml — defines off-chain metadata |
| SEP-6 | Deposit/Withdrawal API for anchors |
| SEP-10 | Stellar Web Auth (wallet authentication) |
| SEP-12 | KYC API (customer info) |
| SEP-24 | Interactive anchor deposit/withdrawal |
| SEP-41 | Contract token interface (SAC standard) |
| SEP-42 | Smart account passkeys |

## Key CAPs

| CAP | Purpose |
|-----|---------|
| CAP-59 | BLS12-381 host functions (ZK verification) |
| CAP-74 | BN254 curve support |
| CAP-75 | Poseidon hash for ZK |

## Ecosystem References
- **Wallets**: Freighter, Lobstr, Wallet Kit
- **Dev Tools**: stellar-sdk, soroban CLI, Hubble
- **DeFi**: Aquarius, Blend, Phoenix
- **Infra**: RPC providers, Horizon endpoints

## Strict Rules
1. Always check the SEP version listed in the integration docs
2. Testnet vs pubnet have different config values — never hardcode
3. SEP-41 tokens use the SAC pattern: `useContract().read("balance_of", [address])`
