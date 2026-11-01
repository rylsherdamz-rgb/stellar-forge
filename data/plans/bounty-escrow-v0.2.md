# Plan: bounty-escrow v0.2 + open-PR integration

**Wave 1 (parallel):** contracts (lib.rs/test.rs) ∥ merge #22 (packages/stellar) ∥ merge #27 (site/)
**Wave 2 (sequential on contracts):** client v0.2 methods + types; CI; docs
**Verifier:** `cargo test` (37/37), release WASM build, `node --test` in packages/stellar
with and without `@stellar/stellar-sdk` (24/24), `tsc --noEmit` for site and d.ts.

**Out of scope:** deploying v0.2 (needs the deployer key), and merging #28 (owner's
security PR; it already passes CI and can merge on its own).
