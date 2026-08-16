# ADR 2026-08-16 — SCF Viability (Project Shaping)

- **Context:** The framework's Instaward SOW lists "Apply to SCF Build Award" as the next step. An initial approach added an `scf` skill for generating SCF applications, but the actual goal is for the Stellar Forge project itself to be a viable SCF candidate — reviewers must be able to run the project, see traction, and check a tranche-aligned plan.
- **Decision:** Remove the `scf` skill, templates, and LIBRARY trigger rows (reverted to the 10-skill set). Instead, make the repo SCF-viable directly:
  - Fix installability: root `npm install` failed because `@stellar/mpp@^1.0.0` and `mppx@^1.0.0` don't exist in the registry; `@stellar/mpp@0.7.1` peers require SDK ^15.1.0 + mppx ^0.6.29. Pinned `templates/backend/package.json` to `@stellar/stellar-sdk@^15.1.0`, `@stellar/mpp@^0.7.1`, `mppx@^0.6.29`; added `tests/package.json` (dotenv, @playwright/test). `npm install` (416 pkgs) + `npm test` now work from a clean checkout.
  - Add SCF-shaped artifacts: `data/projects/stellar-forge.md` (status + evidence registry) and `docs/ROADMAP.md` (tranche #1 MVP → #2 Testnet → #3 Mainnet, with success criteria + reviewer verification per deliverable, including the mandatory tranche-#2 threat model + monitoring plan).
  - Keep `docs/scf/SCF-BUILD-AWARD.md` as the application draft (Open Track, $30,000, 4 months).
- **Consequences:**
  - Accepted: the draft application must be updated with real Instaward results and testnet evidence before submission — no fabricated traction.
  - Accepted: handbook rules change quarterly; re-verify before submitting.
  - Accepted: the roadmap is the source of truth for tranche claims; the deployment registry (`data/deployments/testnet.json`) must be populated during the Instaward thin slice.