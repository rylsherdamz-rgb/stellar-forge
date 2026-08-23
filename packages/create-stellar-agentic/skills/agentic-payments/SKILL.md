---
name: agentic-payments
description: "Agentic and machine-to-machine payments on Stellar. Covers x402 (HTTP 402 paid APIs) and MPP (Machine Payments Protocol) Charge/Channel modes."
version: 0.2.0
---

# Agentic Payments (x402 + MPP)

## Source Files (published with this skill)

| File | Contents |
|------|----------|
| `templates/src/middleware/x402.ts` | Express middleware — checks x402 payment header, verifies OZ channel, rejects unpaid requests with 402 |

## x402 Middleware

See `templates/src/middleware/x402.ts` for the full implementation. Import and apply:

```ts
import { x402Middleware } from "./middleware/x402";

app.use("/api/paid", x402Middleware({ channelId: process.env.OZ_CHANNEL_ID! }));
```

## Payment Setup

- USDC (SEP-41 SAC) on `stellar:testnet` / `stellar:pubnet`
- OZ Channels facilitator for x402
- MPP Charge mode: per-request SAC
- MPP Channel mode: off-chain commits for high-frequency traffic
