# Agentic Kit — Data Query Layer

All blockchain queries go through `useStellarData()`. Never raw RPC or curl.

## Available Hooks

| Hook | Import | Purpose |
|------|--------|---------|
| `useStellarData()` | `@/hooks/use-stellar-data` | Balances, contract queries, events, tx status |
| `useContract(id)` | `@/hooks/use-contract` | `read()` (simulation) + `write()` (sign+submit) |
| `useStellarWallet()` | `@/hooks/use-stellar-wallet` | Connect, disconnect, sign, getBalances |
| `useWallet()` | `@/providers/wallet-provider` | Context — same as useStellarWallet() |

## useStellarData() API

```ts
const { getBalances, queryContract, getContractData, getEvents, getTransaction, loading, error } = useStellarData();
```

| Method | Returns | Description |
|--------|---------|-------------|
| `getBalances(address)` | `{asset, balance}[]` | All trustline balances + native XLM |
| `queryContract(id, method, args)` | `ScVal \| null` | Read-only contract query |
| `getContractData(id, key)` | `ScVal \| null` | Raw contract storage entry |
| `getEvents(id, limit?)` | `Event[]` | Contract events (newest first) |
| `getTransaction(hash)` | `TxResponse \| null` | Tx status + return value |

## useContract() API

```ts
const c = useContract(contractId);
await c.read("name");                        // simulation, no tx
await c.read("balance_of", [addressScVal]);   // any read method
await c.write(sender, "transfer", args, sign); // sim + assemble + sign + submit + confirm
```

## useStellarWallet() API

```ts
const { address, network, connect, disconnect, sign, getBalances, data } = useStellarWallet();
```

## Strict Rules
1. Frontend: always `useStellarData()` — never `fetch()`, `curl`, or raw RPC
2. Read-only state: `useContract().read()` — zero fees, no wallet prompt
3. State-changing calls: `useContract().write()` — full flow handled
4. Backend: use `rpc.*` methods directly only for server-side code
