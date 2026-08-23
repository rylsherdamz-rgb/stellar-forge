---
name: frontend-design
description: >
  Create distinctive, production-grade Stellar dApp UI. Combines bold
  aesthetic direction with smart contract integration patterns — wallet
  connection flows, transaction UX, contract data displays, and agentic
  kit hook wiring. No generic "AI slop" aesthetics.
version: 1.0.0
author: rylsherdamz-rgb
tags:
  - frontend
  - design
  - ui
  - react
  - nextjs
  - stellar
  - blockchain
  - wallet
  - dapp
homepage: https://github.com/rylsherdamz-rgb/stellar-forge
---

# Frontend Design — Stellar dApp UI

Build visually distinctive Stellar dApp frontends that integrate wallet
connection, contract interaction, and transaction flows — all while
avoiding generic "AI slop" aesthetics.

## When to Use

- Designing wallet connect / disconnect UI that stands out
- Displaying on-chain data (balances, token info, contract state) beautifully
- Building transaction confirmation flows with loading + success states
- Creating a cohesive dApp dashboard with contract read/write widgets
- Styling agentic kit components (`useStellarData`, `useContract`, `useWallet`)
- Any Stellar frontend task where visual polish matters

## Design Thinking

Before writing UI code, commit to a bold aesthetic direction:

- **Purpose**: What does this interface do? Who uses it — traders, devs, collectors?
- **Tone**: Pick an extreme — brutalist dark, luxe-light editorial, retro-terminal,
  futuristic glassmorphism, industrial monochrome, playful neo-brutalism.
- **Blockchain UX constraints**: Wallet not connected, waiting for confirmation,
  tx pending, tx confirmed, error states — each needs its own visual language.
- **Differentiation**: What makes this UNFORGETTABLE? A custom loading spinner
  made from Stellar icons? Animated transaction history? A gradient that
  shifts with each new block?

**CRITICAL**: Execute with precision. Bold maximalism and refined minimalism
both work — the key is intentionality, not intensity.

## Stellar dApp UI Patterns

### Pattern 1 — Wallet Connection

Every dApp starts with wallet connect. Design for the full lifecycle:

```
Disconnected → Connecting → Connected → Disconnecting
```

| State | Visual treatment |
|-------|------------------|
| Disconnected | Prominent CTA, subtle pulse animation on the connect button |
| Connecting | Spinner, disabled button, "Opening Freighter..." text |
| Connected | Address badge (abbreviated), XLM balance chip, disconnect affordance |
| Disconnecting | Brief fade before returning to disconnected state |

### Pattern 2 — Transaction Flow

A tx has 4 phases. Each needs distinct UI:

```
Simulate → Sign → Submit → Confirm
```

| Phase | UX |
|-------|----|
| **Simulate** | Show expected state change: "You will send 100 USDC to G..." with gas estimate |
| **Sign** | "Check your wallet to approve" — wallet handles the modal, but show a waiting state |
| **Submit** | Animated progress bar or spinner — "Waiting for ledger confirmation (~5s)" |
| **Confirm** | Success animation + updated balances. Or error with clear reason and retry button |

### Pattern 3 — Contract Data Display

For read-only contract state (`useContract().read()`):

- **Numeric values**: Format with proper decimal places, show loading skeleton
- **Addresses**: Truncate with `G...abcd` pattern, link to Stellar Expert
- **Timestamps**: Relative ("2 min ago") + tooltip with absolute
- **Enums/status**: Badge with color-coded status indicator
- **Empty state**: Never show "0" without context — use "No tokens yet" with illustration

### Pattern 4 — Error States

Blockchain errors are frequent. Design them in:

- **Wallet not connected**: Context-aware prompt, not a red error box
- **User rejected**: Subtle dismissal, no alarm
- **Insufficient XLM**: Actionable — "You need at least 1.1 XLM for this transaction"
- **Network mismatch**: Prominent banner with one-click network switch
- **RPC timeout**: Retry button with exponential backoff indicator

## Tailwind CSS — Mandatory Styling

All UI code must use **Tailwind CSS** (v4+, bundled with the scaffold). No CSS modules, no styled-components, no inline styles for layout or color. Use `tailwindcss` for every design choice — typography, spacing, color, layout, animation.

### Tailwind Patterns for dApps

| Pattern | Tailwind | When |
|---------|----------|------|
| Address display | `font-mono text-sm truncate max-w-[120px]` | All on-chain addresses |
| Loading skeleton | `animate-pulse bg-muted rounded h-{n} w-{n}` | While contract data loads |
| Balance number | `font-mono tabular-nums` | Numeric on-chain values |
| Status badge | `rounded-full px-2 py-0.5 text-xs font-medium bg-{color}/10 text-{color}` | Tx status, token state |
| Card | `rounded-lg border bg-card text-card-foreground shadow-sm` | Data sections |
| CTA button | `px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90` | Primary actions |
| Error message | `text-sm text-destructive bg-destructive/10 rounded px-3 py-2` | Error states |
| Success toast | `text-sm text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/50` | Confirmation |

### Customizing the dApp Theme

In `tailwind.config.ts`, define semantic tokens for your dApp's brand:

```ts
theme: {
  extend: {
    colors: {
      stellar: {   // Stellar brand integration
        blue:  "#3e5b9c",
        purple: "#7c3aed",
      },
    },
    fontFamily: {
      mono: ["JetBrains Mono", "Fira Code", "monospace"], // for addresses + data
    },
    keyframes: {
      "slide-bar": { "0%": { width: "0%" }, "100%": { width: "100%" } },
    },
    animation: {
      "slide-bar": "slide-bar 5s ease-in-out",
    },
  },
}
```

### Dark Mode

Every dApp must support both light and dark modes using Tailwind's `dark:` variant:

```tsx
<div className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
```

Never hardcode colors without a dark mode counterpart.

## Agentic Kit Integration

All Stellar data flows through the agentic kit hooks. Every UI component
must use these — never raw RPC.

### Component → Hook Mapping

| UI Concern | Hook | Purpose |
|------------|------|---------|
| Wallet button | `useWallet()` | Connect/disconnect, address, sign |
| Balance list | `useStellarData().getBalances` | All asset balances |
| Contract reader | `useContract(id).read()` | Simulation-only read |
| Contract writer | `useContract(id).write()` | Sign + submit + confirm |
| Event stream | `useStellarData().getEvents` | On-chain event display |
| Transaction status | `useStellarData().getTransaction` | Confirmation check |

### Design Rules for Hook Data

1. Show **loading skeleton** (not spinner) while `getBalances` or `read()` resolves
2. Show **last-updated timestamp** for cached on-chain data
3. Always handle `error` from `contract.data.error` or `data.error`
4. Use `addressToScVal` / `i128ToScVal` from `lib/stellar-config.ts` for args
5. Never display raw `ScVal` — always convert via `scvalToString` / `scvalToNumber`
6. After a `write()` completes, auto-refresh relevant `read()` data

## Source Files (published with this skill)

| File | Location | Contents |
|------|----------|----------|
| Provider | `templates/frontend/providers/wallet-provider.tsx` | React context + `useWallet()` export |
| Hook source | `templates/frontend/hooks/use-stellar-data.ts` | `getBalances`, `queryContract`, `getContractData`, `getEvents` |
| Hook source | `templates/frontend/hooks/use-contract.ts` | `read()` (simulation), `write()` (sign+submit+confirm) |
| Hook source | `templates/frontend/hooks/use-stellar-wallet.ts` | `connect`, `disconnect`, `sign`, `getBalances` |
| Component | `templates/frontend/components/connect-button.tsx` | Connect + disconnect + XLM badge |
| Component | `templates/frontend/components/invoke-contract.tsx` | Read/write any contract method from UI |
| Component | `templates/frontend/components/send-payment.tsx` | Send XLM with balance refresh |
| Config | `templates/frontend/lib/stellar-config.ts` | RPC config, network config, ScVal helpers |
| Examples | `templates/frontend/examples/use-stellar-data-example.tsx` | BalanceViewer, ContractReader, EventList, UsdcBalance |
| Examples | `templates/frontend/examples/dashboard-page.tsx` | Full dashboard layout with ConnectButton + InvokeContract |
| Deploy tracker | `data/deployments/<network>.json` | Contract IDs + WASM hashes per network |
| Deploy script | `scripts/deploy-contract.sh` | Build → test gate → deploy → record → .env update |
| Env template | `.env.example` | All env vars with contract address placeholders |

## Working Examples

### Wallet connect with balance badge

```tsx
function StellarStatusBar() {
  const { address, connect, disconnect, getBalances } = useWallet();
  return address ? (
    <div className="flex items-center gap-3 px-4 py-2 border-b bg-card">
      <div className="w-2 h-2 rounded-full bg-green-400" />
      <span className="font-mono text-sm">{address.slice(0,6)}...{address.slice(-4)}</span>
      <BalanceBadge onRefresh={() => getBalances()} />
      <button onClick={disconnect} className="text-xs text-muted-foreground hover:text-destructive">
        Disconnect
      </button>
    </div>
  ) : (
    <button onClick={connect} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium">
      Connect Wallet
    </button>
  );
}
```

### Contract data with loading skeleton

```tsx
function TokenBalance({ contractId, address }: { contractId: string; address: string }) {
  const { read } = useContract(contractId);
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    read("balance_of", [addressToScVal(address)])
      .then(v => setBalance(v ? scvalToNumber(v).toLocaleString() : "0"))
      .finally(() => setLoading(false));
  }, [contractId, address]);

  if (loading) return <div className="h-6 w-24 bg-muted animate-pulse rounded" />;
  return <span className="font-mono tabular-nums">{balance}</span>;
}
```

### Transaction flow with all 4 phases

```tsx
function TransferForm({ contractId }: { contractId: string }) {
  const { address, sign } = useWallet();
  const { write, data } = useContract(contractId);
  const [phase, setPhase] = useState<"idle"|"simulating"|"signing"|"submitting"|"confirmed"|"error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleTransfer(to: string, amount: bigint) {
    if (!address) return;
    setPhase("simulating");
    try {
      const res = await write(address, "transfer", [
        addressToScVal(address), addressToScVal(to), i128ToScVal(amount),
      ], sign);
      setPhase(res.hash ? "confirmed" : "error");
    } catch (e: any) {
      setErrorMsg(e.message);
      setPhase("error");
    }
  }

  return (
    <div className="space-y-3">
      {/* phase-specific UI */}
      {phase === "simulating" && <p className="text-sm text-muted-foreground animate-pulse">Simulating transfer...</p>}
      {phase === "signing" && <p className="text-sm text-muted-foreground">Check your wallet to approve</p>}
      {phase === "submitting" && <div className="h-1 bg-muted rounded overflow-hidden"><div className="h-full bg-primary w-1/2 animate-slide" /></div>}
      {phase === "confirmed" && <p className="text-sm text-green-500">Transfer confirmed!</p>}
      {phase === "error" && <p className="text-sm text-destructive">{errorMsg}</p>}
      {data.error && <p className="text-xs text-destructive">{data.error}</p>}
    </div>
  );
}
```

## Strict Rules

1. **All UI uses Tailwind CSS** — no CSS modules, styled-components, or inline styles for layout/color
2. **Every dApp supports dark mode** via `dark:` variant — never hardcode colors without a dark counterpart
3. **All blockchain queries** use `useStellarData()` — no `fetch()`, no `axios`, no raw RPC
4. **Read-only** uses `useContract().read()` — simulation, zero fees, no wallet prompt
5. **State-changing** uses `useContract().write()` — handles sim + assemble + sign + submit + confirm
6. **Every transaction flow phase** has a distinct visual state — never show a generic spinner
7. **Loading states** use skeleton placeholders matching the content shape, not text spinners
8. **Error states** are context-aware and actionable — not generic "Something went wrong"
9. **Wallet connection** shows the full lifecycle: disconnected → connecting → connected → disconnecting
10. **After write() completion**, auto-refresh `read()` data and balances
11. **Never display raw ScVal** — convert via helpers from `lib/stellar-config.ts`
12. **Design with intention** — pick a bold direction and execute precisely. No generic defaults.
