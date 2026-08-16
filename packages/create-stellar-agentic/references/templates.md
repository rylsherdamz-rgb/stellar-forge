# Template Reference

Source code in `templates/` serves as reference for code generation.

## Frontend (`templates/frontend/`)

| Path | Purpose |
|------|---------|
| `hooks/use-stellar-data.ts` | Blockchain data query hook |
| `hooks/use-contract.ts` | Contract read/write hook |
| `hooks/use-stellar-wallet.ts` | Wallet connection hook |
| `providers/wallet-provider.tsx` | React context provider |
| `components/connect-button.tsx` | Connect/disconnect UI with balance |
| `components/invoke-contract.tsx` | Contract read/write UI |
| `components/send-payment.tsx` | XLM send UI |
| `lib/stellar-config.ts` | RPC + network config |
| `examples/` | Working example components |

## Backend (`templates/backend/`)

| Path | Purpose |
|------|---------|
| `src/index.ts` | Express server with balance + contract endpoints |
| `src/services/stellar.ts` | RPC client for server-side queries |
| `src/middleware/x402.ts` | x402 payment enforcement middleware |

## Contracts (`templates/contracts/`)

| Path | Purpose |
|------|---------|
| `hello-world/src/lib.rs` | Minimal contract scaffold |
| `hello-world/src/test.rs` | Unit tests for scaffold |
| `token/src/lib.rs` | Full SEP-41 token implementation |
| `token/src/test.rs` | Token unit tests |
