---
name: data
description: "Querying Stellar chain data via Stellar SDK (preferred), Stellar RPC, and Horizon (legacy). Covers SDK methods, JSON-RPC, REST endpoints, streaming, pagination, agentic kit integration."
version: 0.2.0
---

# Data — Stellar Chain Queries

All blockchain queries use `useStellarData()` (frontend) or Stellar SDK / RPC directly (backend). Never raw curl or manual RPC calls.

## Source Files (published with this skill)

| File | Contents |
|------|----------|
| `templates/src/index.ts` | Express server — balance endpoint, contract query endpoint, CORS |
| `templates/src/services/stellar.ts` | RPC client — `getBalances`, `queryContract`, `getContractData`, `getEvents`, `getTransaction` |

## Agentic Kit (Frontend)

Import from `@/hooks/use-stellar-data`:

```ts
const { getBalances, queryContract, getContractData, getEvents, getTransaction, loading, error } = useStellarData();
```

| Method | Returns | Description |
|--------|---------|-------------|
| `getBalances(address)` | `{asset, balance}[]` | All trustline balances + native XLM |
| `queryContract(contractId, method, args[])` | `ScVal \| null` | Read-only contract query (simulation) |
| `getContractData(contractId, key)` | `ScVal \| null` | Raw contract storage entry |
| `getEvents(contractId, limit?)` | `Event[]` | Contract events (newest first) |
| `getTransaction(hash)` | `TxResponse \| null` | Check tx status + return value |

## Backend / API

Use the Stellar SDK directly:

```ts
import { rpc } from "@/lib/stellar-config";
const account = await rpc.getAccount(address);
const sim = await rpc.simulateTransaction(tx);
const sent = await rpc.sendTransaction(signedTx);
const events = await rpc.getEvents({ contractIds: [contractId] });
```

## Raw RPC (if needed)

- `rpc.getLedgerEntries(keys)` — raw ledger data
- `rpc.getNetwork()` — network info
- `rpc.getLatestLedger()` — current ledger seq
- Horizon: `GET /accounts/{id}`, `GET /claimable_balances`, `GET /payments`

## Strict Rules
1. Frontend: always use `useStellarData()` — never raw RPC or curl
2. Read-only contract state: use `useContract().read()` (simulation, no tx)
3. State-changing contract calls: use `useContract().write()` (sign + submit)
4. Backend: use `rpc.*` methods directly for server-side queries
