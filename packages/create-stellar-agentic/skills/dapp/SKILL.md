---
name: dapp
description: "Stellar dApp / frontend development. Covers javascript stellar-sdk, Stellar Wallets Kit, and the agentic kit data layer — useStellarData(), useContract(), useStellarWallet(). No raw RPC or curl."
version: 0.2.0
---

# dApp — Agentic Kit Frontend

All blockchain queries go through `useStellarData()`. Never write raw RPC or curl.

## Wallet Setup (one-time)

```ts
// providers/wallet-provider.tsx
import { WalletProvider } from "@/providers/wallet-provider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      {children}
    </WalletProvider>
  );
}
```

## Hooks API

### `useStellarData()` — Blockchain queries

```ts
import { useStellarData } from "@/hooks/use-stellar-data";

const {
  getBalances,     // (address: string) => { asset, balance }[]
  queryContract,   // (id: string, method: string, args: ScVal[]) => ScVal | null
  getContractData, // (id: string, key: ScVal) => ScVal | null
  getEvents,       // (id: string, limit?: number) => Event[]
  getTransaction,  // (hash: string) => TxResponse | null
  loading,         // boolean
  error,           // string | null
  rpc,             // raw RPC client (fallback only)
} = useStellarData();
```

### `useContract(contractId)` — Contract read/write

```ts
import { useContract } from "@/hooks/use-contract";

const c = useContract("CA3...");
await c.read("name");                              // simulation-only, no tx
await c.read("balance_of", [addressArg]);          // any read method
await c.write(sender, "transfer", args, signFn);   // full sign+submit
// c.data exposes the underlying useStellarData()
```

### `useStellarWallet()` — Wallet connection + data

```ts
import { useStellarWallet } from "@/hooks/use-stellar-wallet";

const {
  address,      // string | null
  network,      // string | null
  connect,      // () => Promise<void>
  disconnect,   // () => void
  sign,         // (xdr: string) => Promise<string>
  getBalances,  // () => Promise<{asset, balance}[]>
  data,         // useStellarData()
} = useStellarWallet();
```

### `useWallet()` — From WalletProvider context

```ts
import { useWallet, useContract, useStellarData } from "@/providers/wallet-provider";

const { address, sign, data, getBalances } = useWallet();
// Same as useStellarWallet() but from context — no need to call connect()
```

## Source Files (published with this skill)

| File | Location | Contents |
|------|----------|----------|
| Hook source | `hooks/use-stellar-data.ts` | `getBalances`, `queryContract`, `getContractData`, `getEvents`, `getTransaction` |
| Hook source | `hooks/use-contract.ts` | `read()` (simulation), `write()` (sign+submit) |
| Hook source | `hooks/use-stellar-wallet.ts` | `connect`, `disconnect`, `sign`, `getBalances` |
| Provider | `providers/wallet-provider.tsx` | React context + `useWallet()` export |
| Components | `components/connect-button.tsx` | Connect + disconnect + XLM balance badge |
| Components | `components/invoke-contract.tsx` | Read/write any contract method from UI |
| Components | `components/send-payment.tsx` | Send XLM with balance refresh after send |
| Config | `lib/stellar-config.ts` | RPC config, network config, helper ScVal functions |
| Examples | `examples/use-stellar-data-example.tsx` | BalanceViewer, ContractReader, EventList, UsdcBalance, XlmBalanceBadge |
| Examples | `examples/dashboard-page.tsx` | Full dashboard layout with ConnectButton + InvokeContract |

## Working Examples

### Balance viewer
```tsx
function Balances({ address }: { address: string }) {
  const { data } = useWallet();
  const [bals, setBals] = useState<{asset:string,balance:string}[]>([]);
  useEffect(() => { data.getBalances(address).then(setBals); }, [address]);
  return <ul>{bals.map(b => <li key={b.asset}>{b.asset}: {b.balance}</li>)}</ul>;
}
```

### Contract name reader
```tsx
function ContractName({ id }: { id: string }) {
  const { read } = useContract(id);
  const [name, setName] = useState("...");
  useEffect(() => { read("name").then(r => r && setName(scvalToString(r))); }, [id]);
  return <p>{name}</p>;
}
```

### Contract write + balance refresh
```tsx
function Transfer({ id, to }: { id: string; to: string }) {
  const { address, sign } = useWallet();
  const { write } = useContract(id);
  const [status, setStatus] = useState("");

  async function handleTransfer() {
    if (!address) return;
    setStatus("sending...");
    const res = await write(address, "transfer", [
      addressToScVal(address), addressToScVal(to), i128ToScVal(100_000_000n)
    ], sign);
    setStatus(`done: ${res.hash}`);
  }

  return <button onClick={handleTransfer}>{status || "Transfer 100 USDC"}</button>;
}
```

### Event list (recent 5)
```tsx
function Events({ id }: { id: string }) {
  const { data } = useWallet();
  const [events, setEvents] = useState<any[]>([]);
  useEffect(() => { data.getEvents(id).then(setEvents); }, [id]);
  return <ul>{events.slice(0,5).map((e,i) => <li key={i}>{e.type}</li>)}</ul>;
}
```

## Strict Rules
1. `useStellarData()` for every blockchain query — no `fetch()`, no `curl`, no raw RPC
2. `useContract().read()` for simulation-only reads (zero fees, no wallet prompt)
3. `useContract().write()` for state-changing calls (handles sim + assemble + sign + submit + confirm)
4. For raw RPC access (rare): use `data.rpc.*` only when none of the above methods fit
5. All examples live in `templates/frontend/examples/` — reference them directly when generating code
