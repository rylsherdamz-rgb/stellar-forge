[CAPABILITY EVAL: stellar-frontend]
Task: Build a Next.js 15 App Router frontend with Stellar Wallets Kit, wallet connection, transaction building, and contract invocation.
Success Criteria:
  - [ ] TypeScript compiles with `npx tsc --noEmit`
  - [ ] `@stellar/stellar-sdk` dependency installed
  - [ ] `@creit.tech/stellar-wallets-kit` installed with allowAllModules()
  - [ ] `@stellar/freighter-api` installed as fallback
  - [ ] Network config file at `lib/stellar-config.ts` with testnet/mainnet/local support
  - [ ] Wallet provider wrapping app layout
  - [ ] Connect button component with address display + disconnect
  - [ ] Transaction builder with simulation and assembly
  - [ ] Smart contract invocation helper (build → simulate → assemble → sign → submit)
  - [ ] Error handling for: wallet not connected, user rejected, insufficient XLM, network mismatch
  - [ ] Loading states during wallet signing and transaction submission
  - [ ] Environment variables via `.env.local` (not hardcoded)
  - [ ] RPC client used for contract interactions (not Horizon for Soroban txs)
  - [ ] Distinct visual states for each transaction flow phase (simulate/sign/submit/confirm)
  - [ ] All agentic kit hooks used — no raw RPC or curl
  - [ ] Wallet connection lifecycle renders correctly (connected/disconnected states)
Expected Output: A frontend/ directory with working Next.js app, wallet connection UI, and contract interaction patterns.

[REGRESSION EVAL: frontend-wallet-integration]
Baseline: Stellar Wallets Kit best practices
Tests:
  - multi-wallet: PASS/FAIL — allows Freighter, LOBSTR, xBull via Wallets Kit
  - tx-simulation: PASS/FAIL — simulates before sending
  - error-messages: PASS/FAIL — user-friendly error messages for common failures
  - env-config: PASS/FAIL — network config loaded from env, not hardcoded
  - tx-flow-phases: PASS/FAIL — distinct UI for simulate/sign/submit/confirm states
  - error-states: PASS/FAIL — context-aware, actionable error messages
  - design-intent: PASS/FAIL — cohesive aesthetic direction, no generic defaults
Result: X/Y passed
