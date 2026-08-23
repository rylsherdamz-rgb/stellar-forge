# /test-e2e

Run end-to-end tests using the Stellar Agentic Kit.

## Usage
```
/test-e2e <project-path> [network]
```
- `network`: `local` (default), `testnet`

## Steps
1. Start local Stellar network if needed: `stellar container start local` (or check docker-compose)
2. Deploy contracts if not deployed: invoke `/deploy <project-path> local`
3. Create test accounts and fund them
4. Run Playwright tests: `npx playwright test --config <project>/tests/playwright.config.ts`
5. Run Stellar Agentic Kit payment flow tests:
   - x402: `node <project>/tests/x402-flow.mjs`
   - MPP: `node <project>/tests/mpp-charge-flow.mjs`
6. Verify contract state via RPC: `node <project>/tests/contract-state.mjs`

## Expected Results
```
PLAYWRIGHT: X passed, 0 failed, Y skipped
X402 FLOW:  Paid request → 200 OK
MPP FLOW:   SAC transfer → confirmed on-chain
STATE:      Contract data matches expectations
```

## On Failure
1. Capture the specific failure output
2. Check the Stellar Quickstart logs: `docker logs stellar-quickstart`
3. Re-spawn the failing agent with the error context
4. Max 2 retry attempts

## Cleanup
1. Write test results to `data/decisions/<date>-e2e-<project-name>.md`
2. Run `/graphify <project> --no-viz` to update project graph with test evidence
