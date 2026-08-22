[CAPABILITY EVAL: stellar-backend]
Task: Build a backend API server with Stellar RPC/Horizon integration, x402 payment middleware, and MPP charge/channel mode support.
Success Criteria:
  - [ ] RPC client initialized via `new StellarSdk.rpc.Server(config.rpcUrl)`
  - [ ] Horizon client initialized as fallback
  - [ ] Environment-based network config (testnet/mainnet/local)
  - [ ] Error handling with exponential backoff for rate limits
  - [ ] Transaction simulation before submission
  - [ ] Polling for transaction confirmation (getTransaction loop)
  - [ ] CORS configured for frontend origin
  - [ ] x402 payment middleware installed with `@x402/express` (if paid API needed)
  - [ ] MPP charge server configured (if payment flow needed)
  - [ ] MPP channel support configured (if high-frequency payments needed)
  - [ ] CAIP-2 network IDs used (`stellar:testnet`, `stellar:pubnet`)
  - [ ] All secrets configurable via environment variables (not hardcoded)
Expected Output: A backend/ directory with Express/Fastify server, network configuration, payment middleware, and data service layers.

[REGRESSION EVAL: backend-payment-security]
Baseline: x402/MPP security best practices
Tests:
  - usdc-trustline: PASS/FAIL — recipient account has USDC trustline documented
  - fee-sponsorship: PASS/FAIL — pull mode for fee sponsorship documented
  - network-isolation: PASS/FAIL — mainnet/testnet configs isolated, no cross-contamination
  - no-secrets: PASS/FAIL — no API keys or secrets in source code
Result: X/Y passed
