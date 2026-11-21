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

## Addendum — v0.3 (#34, #35, #36, #37)
- **Reject/revise:** `reject_submission` is allowed only before the deadline, so a
  late rejection can't be followed by a refund.
- **Review window:** an optimistic `claim_after_review` protects developers from
  creators who never respond. The creator always has an explicit window to approve,
  reject, or dispute. This is not merge-based auto-release (SPEC §19).
- **Fee:** at most 10%, only on developer payouts, and rounded down so net + fee == amount.
- **Snapshot:** fee and review period are stored per bounty in `Terms(id)` at
  creation, outside `Bounty`, so admin changes never alter live bounties and the
  struct layout clients decode stays the same.
- **Deploy:** `scripts/deploy-bounty-escrow.sh` is the reproducible path. It is
  gated on tests and never writes the kernel-owned registry.
