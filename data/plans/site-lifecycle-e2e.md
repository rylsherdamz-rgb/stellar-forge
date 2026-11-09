# Plan: make the web app's on-chain flow work end to end, then polish the UI

**Found:** the client called `/api/bounties/:id/build`, which did not exist, so
every create/claim/submit/approve failed. Reads used the contract id as a tx
source (always failed, `next_id` was always 0). `@stellar/stellar-sdk` 13 can no
longer parse testnet simulation XDR. `/confirm` trusted the request body for
escrow id, developer and status. `packages/stellar` tests failed on SDK >=14.

**Wave 1 (parallel):** api (build route, confirm hardening, SDK 17, error
decoding) ∥ ui (shared shell, stepper, role-aware actions, filters, create
preview, PR pre-check) ∥ client test fix.
**Wave 2:** `site/scripts/e2e-testnet.mjs` against live testnet — full
lifecycle plus refusal checks. Caught the u32 Status decode bug (retry 1).
**Wave 3:** CI runs site lint + unit tests.

**Verifier:** site `tsc`, `eslint`, `npm test` (11/11), `next build`; root
`npm test` (9 + 24); `cargo test` 37/37; testnet e2e green (escrow #1).

**Out of scope:** deploying contract v0.2 — testnet still runs v0.1
(`is_paused` is absent on-chain). The site only uses v0.1-compatible calls.
