# Market Analysis — Stellar Forge

**Version:** 1.0 (2026-08-16) · For the SCF Build-Award submission (Open Track)

## 1. Market overview

Two converging trends define the market:

1. **Agentic payments**: machine-to-machine payments are becoming a requirement for AI agents (x402 paid APIs, MPP). Agents need to pay per-call in stablecoins with zero friction. Stellar is positioned for this: USDC native, fast finality (~5s), sub-cent fees, and an emerging agentic toolkit (Stellar Agentic Kit, x402, MPP, Soroban smart contracts).
2. **Agentic development tooling**: AI coding assistants (Claude Code, Cursor, Codex) now write most starter code, but ship it *unverified*. Developers need harnesses that route work to specialists, verify output with evals, and deploy safely. This is a new category ("evals-driven scaffolding") that is still wide open.

The intersection — *"verified Stellar apps, built by agents, monetized by agents"* — is Stellar Forge's wedge.

## 2. Target segments

| Segment | Pain | Forge solution | TAM signal |
|---------|------|----------------|-----------|
| Independent devs / hackers | Stellar/Soroban learning curve; unverified agent output | 6 specialist agents + evals + templates; one command scaffold | SCF community; hackathon volume |
| Web3 startups | Slow token/dApp delivery; few Rust/Soroban devs | Contract/frontend/backend parallelism via work graph | Stellar ecosystem projects (920+ tracked) |
| AI-agent builders | No standard way to accept payments | x402/MPP templates + Gateway catalog of payment playbooks | x402/MPP adoption growth |
| Ambassadors & chapters | Need fundable, reviewable project artifacts | SCF-grade docs: threat model, monitoring plan, reproducibility guide | Instaward program exists for exactly this |

## 3. Competitive landscape

| Competitor | Focus | Where Forge differs |
|------------|-------|---------------------|
| Stellar Raven (SDF experimental) | *Context* for agents (docs MCP gateway) | Raven informs; Forge *builds* — Gateway is one component; Forge also ships evals + graph orchestration + deploy pipeline |
| Agentic Kit (SDF) | React data layer | Forge wraps it: templates consume `useStellarData`/`useContract` out of the box |
| Hardhat/Foundry (EVM) | Build/test/deploy for EVM | Stellar-native (Soroban, WASM, CAP-59 zk); eval-driven multi-agent instead of single CLI |
| Generic AI scaffolding (v0, create-next-app + AI) | Greenfield web apps | Stellar-specific correctness: evals verify contract IDs, SEP-41 interop, payment flows — not just compilation |
| No-code chain builders (non-Stellar) | Drag-drop contracts | Keeps developer control; agents are assistants with verifiable output, not black boxes |

**Differentiation summary:** nobody combines (a) Stellar-specific specialist agents, (b) formal evals as a deploy gate, (c) parallel work-graph execution, (d) agentic payment templates (x402/MPP), and (e) a context gateway in one open-source package. Raven proves the ecosystem wants (e); Forge is the only project that ships (a)–(e) together.

## 4. Business analysis

**Revenue model (post-grant):**
- Free forever: framework + templates (Apache-2.0/MIT) — adoption flywheel
- Paid: hosted Gateway (managed MCP endpoint, per-seat), private catalogs/playbooks for teams, priority deployment support
- Ecosystem: template marketplace fees (future), SCF/ecosystem grants as validation

**Unit economics:** zero marginal cost per scaffold; hosting costs only for Gateway. $30k grant covers 4 months of full-time build; revenue model starts after tranche #3.

**Costs (4 months):** developer time (2 builders), testnet infra (near-zero), hosting for Gateway preview (Vercel free tier + RPC), community budget (reinvested in ecosystem content — kept minimal per SCF budget rules).

**Risks & mitigation:**

| Risk | Mitigation |
|------|------------|
| Soroban SDK churn (rc versions) | Pinned template versions verified against registry (see REPRODUCIBILITY) |
| Agent quality variance | Evals gate every node; steering on failure (max 3 retries) |
| Low adoption | Chapter Instaward sprint gives real users; community events; docs-first |
| SCF rule changes | Handbook tracked; tranche deliverables designed to outlive program (threat model, monitoring) |

## 5. Technical analysis

**Why Stellar (vs EVM or off-chain):** finality (~5s), fees, USDC-native settlement, SAC token interop (SEP-41), CAP-59 zk host functions, and an SDF actively investing in agentic tooling. Forge's templates exploit all five.

**Stack choices:** Rust + soroban-sdk 27 for contracts; Next.js 15 + Agentic Kit for dApps; Node/Express for APIs; MCP (streamable HTTP) for the Gateway; file-based state (JSON/markdown) instead of a DB — low ops, auditable, git-native.

**Key technical milestones (see ROADMAP.md):** T1 MVP scaffold → T2 testnet dApp + gateway + security docs → T3 mainnet reference dApp + npm publish + community launch.

## 6. Go-to-market

- **Ambassador channel:** Philippines chapter Instaward sprint (SOW exists) — dogfood, demo, recruit
- **Hackathons:** Stellar community events; one-command scaffold + funded testnet wallet = fastest path to demo
- **Content:** eval-driven build logs (each graph run is a case study); x402/MPP tutorials
- **Distribution:** npm (`create-stellar-agentic`), GitHub, docs site, agent skill marketplaces (Claude Code, opencode)

## 7. Community & ecosystem alignment

- Follows SCF budget DOs: no paid marketing, no paid audits (Audit Bank covers); funds go to engineering
- Everything is open-source and reproducible (REPRODUCIBILITY.md) — reviewers can rerun every claim
- Adopts SDF experimental patterns (Raven-style gateway) rather than competing with them

_References: Stellar ecosystem tracker (920+ projects), SCF handbook (2026), x402/MPP specs, Agentic Kit docs._