# Evaluation Definitions

5 eval files in `evals/`. Each defines pass/fail criteria. Max 3 retries per agent.

## 01-contract-eval
- Contract compiles (`cargo build`)
- Tests pass (`cargo test`)
- No unsafe code
- Uses soroban-sdk types correctly
- Deploy gated on all tests passing
- Deployed contract recorded in `data/deployments/` and `.env`

## 02-frontend-eval
- TypeScript compiles (`npx tsc --noEmit`)
- Wallet connect/disconnect works
- Contract read shows data
- Contract write submits tx
- Uses `useStellarData()` — no raw RPC calls
- Distinct UI states for each tx flow phase
- Cohesive aesthetic direction — no generic defaults

## 03-backend-eval
- Server starts
- Balance endpoint returns valid data
- Contract query endpoint works
- CORS headers present

## 04-payment-eval
- x402 middleware rejects unpaid requests with 402
- x402 middleware accepts valid payment
- MPP charge flow succeeds

## 05-framework-eval
- All agents produced output
- All evals ran
- Graphify completed
- Decision record written
