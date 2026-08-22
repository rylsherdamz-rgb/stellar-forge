---
name: zk-proofs
description: >
  Zero-knowledge proofs and privacy patterns on Stellar. Covers Groth16
  verification via BLS12-381 host functions (CAP-0059), Circom (on-chain
  verifiable today), Noir, and RISC Zero toolchains. Use when building
  privacy-preserving dApps, ZK verifier contracts, or wiring proving
  systems to Stellar.
version: 0.2.0
author: rylsherdamz-rgb
tags:
  - stellar
  - zero-knowledge
  - zk
  - groth16
  - circom
  - noir
  - risc-zero
  - bls12-381
---

# ZK Proofs

## When to Use
- Privacy-preserving transactions on Stellar
- On-chain ZK verification in Soroban contracts
- Private voting, identity, or credential systems
- Integrating Circom/Noir with Stellar

## Toolchain Status

| Tool | On-Chain Verifiable | Notes |
|------|-------------------|-------|
| Circom | Yes (today) | Groth16 via BLS12-381 host functions |
| Noir | Pending BN254 | Attestation pattern until CAP-74 lands |
| RISC Zero | Pending BN254 | Attestation pattern for now |

## Groth16 Verification (Circom)
Uses BLS12-381 pairing check host functions (available since Protocol 20).

```
circuit.circom → r1cs → zkey → proof.json + public.json
                                   ↓
                        Soroban contract verifier
                        (import soroban-zk-verifier)
```

## Strict Rules
1. Only Circom proofs can be verified on-chain today
2. Noir and RISC Zero use the off-chain attestation pattern until BN254 lands
3. ZK verifier contracts must import `soroban-zk-verifier` crate
4. Always test with small circuits first — proving is expensive
