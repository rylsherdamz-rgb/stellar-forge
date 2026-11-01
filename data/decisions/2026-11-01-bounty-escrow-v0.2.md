# ADR: bounty-escrow v0.2 — disputes, admin controls, typed events

- **Date:** 2026-11-01
- **Status:** Accepted
- **Issues:** #29, #30, #31, #32

## Context
v0.1 (testnet `CCUG6LFK…NLKZU`) had a funds-lock: once `Submitted`, only creator
approval could move escrow. `refund_bounty` also accepted `Disputed`, which no
code path ever set. The stored `Admin` had no powers, errors were declared as
`#[contracttype]` (so callers saw a generic host error rather than the code), and
`Events::publish` is deprecated in soroban-sdk 27.

## Decision
1. **Disputes:** either party moves `Submitted → Disputed`. Only the admin settles
   (`resolve_dispute(id, pay_developer)`). Refunds are limited to `Open`/`Claimed`
   after the deadline, and submissions must land before the deadline.
2. **Narrow admin:** pause (blocks create/claim only), token allowlist, two-party
   admin rotation, WASM upgrade. The admin can't move funds outside a dispute.
3. **Lifecycle:** `unclaim_bounty`, `SelfClaim` guard, `extend_deadline` (later only).
4. **ABI:** `#[contracterror]` with append-only codes (17–21 new); `Status`
   discriminants unchanged; typed `#[contractevent]`s with the bounty id as a topic.

## Consequences
- v0.1 has no `upgrade`, so v0.2 is a **fresh deploy**. After deploy: `initialize`,
  then `set_token_allowed(native XLM SAC, true)`. The kernel then updates
  `data/deployments/testnet.json` and the client's `BOUNTY_ESCROW_CONTRACT_ID`.
- Dispute resolution trusts the admin. A multisig or DAO admin is the follow-up.
- Event payloads changed shape (typed structs), and the indexer (#15) should target v0.2.
