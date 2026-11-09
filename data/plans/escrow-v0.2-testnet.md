# Plan: deploy bounty-escrow v0.2 to testnet and use it from the web app

**Wave 1:** build release WASM (29,655 B, sha256 eb068705…25f7) → deploy with
`site/scripts/deploy-testnet.mjs` (JS SDK; no stellar CLI): upload, create,
initialize, allowlist native XLM. Contract `CAPDV2E5…RJOZ`.
**Wave 2 (parallel):** per-bounty `contractId` so v0.1 escrows stay readable ∥
generic action builder + v0.2 actions (unclaim, dispute, extend) ∥ chain sync on
read ∥ UI (role-aware panel, confirm step, extend form, paused notice).
**Wave 3:** testnet e2e: scenario 1 (happy path) + scenario 2 (claim, release,
re-claim, extend, submit, dispute, admin resolve, app syncs on read). Both green.

**Admin key:** `set_admin` requires the new admin's signature, so the deploy
key could not be handed to the project admin (GD4Q…ECDW) unilaterally. The
throwaway admin key was given to the owner out of band; rotate with both
signatures when convenient.
