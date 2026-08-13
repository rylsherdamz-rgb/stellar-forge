# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Stellar/Soroban developers, dApp builders, and hackathon participants using AI assistants (Claude Code, OpenCode). Secondary: anyone evaluating AI-assisted blockchain development without Claude Code. They arrive from GitHub, npm, X, and the promo video, evaluating within seconds whether this beats generic ChatGPT/Copilot workflows.

## Product Purpose

Stellar Forge is an open-source reference implementation (MIT) for AI-assisted Stellar development: an installable Skill (6 specialist agents + graph-engine kernel) plus a scaffolding CLI (`create-stellar-agentic`). The CLI bootstraps a production-ready Stellar monorepo; the Skill builds it with AI. Success is a visitor installing the Skill, running the CLI, or both, and believing the "graph engine + evals, not a chat" mechanism.

## Positioning

Domain knowledge embedded where generic AI tools are blind: contracts must be `#![no_std]` soroban-sdk, wallets use Stellar Wallets Kit (not wagmi), x402 needs OZ Channels + CAIP-2 network IDs, ZK verification is BLS12-381 (not BN254). Every agent output is verified against structured pass/fail evals with max 3 retries — "It's not a chat — it's a multi-agent graph engine with domain expertise."

## Operating Context

Visitors are developers: terminals, CLIs, npm, GitHub, monospace code blocks, and technical correctness matter. The core install verbs are `npx skills add rylsherdamz-rgb/stellar-forge` and `npx create-stellar-agentic my-dapp --yes`. A 60-second promo video (media/promo.mp4) demonstrates the workflow. Testnet-gated builds, evals, and a knowledge graph are the framework's own rituals.

## Capabilities and Constraints

- Two entry points: Skill (agent orchestration for Claude Code/OpenCode) and CLI (standalone project scaffold); both are first-class and combinable.
- Six agent nodes: @stellar-contracts, @stellar-frontend, @stellar-backend, @stellar-payments, @stellar-ops, @stellar-zk — zones with edges and verifiers.
- Kernel (CLAUDE.md) generates a work graph per task: sequential/parallel/conditional edges, fan-out/fan-in, dynamic org rewiring.
- 10 domain skills (soroban-sdk, Wallets Kit, x402/MPP, SEPs/CAPs, Groth16/zk, stellar-mcp, graphify, etc.) loaded on demand; 5 eval files.
- MIT licensed, v0.3.0. Repo: github.com/rylsherdamz-rgb/stellar-forge. npm: create-stellar-agentic.
- Site is Next.js 16 App Router, single landing page, plain CSS + GSAP + lucide-react. Copy, links, and commands are user-confirmed immutable for this redesign.

## Brand Commitments

- Name: **Stellar Forge**. Logo: violet node-graph mark (favicon.svg) on dark ground.
- Existing identity commitment (user-confirmed): every text string, link, and terminal command on the site must remain exactly as-is. Visual treatment only.
- Tone: technical, precise, credible — a developer tool, not hype.

## Evidence on Hand

- 60s promo video: media/promo.mp4, poster: site/public/promo-poster.png (also public/promo.mp4).
- README.md, SKILL.md, CLAUDE.md document architecture, agents, install matrix, and eval pipeline.
- Live site: stellar-agentic-framework.vercel.app. X promo: https://x.com/ChichiCode0/status/2084510317862895653
- No testimonials, customer logos, benchmarks, or pricing exist; must not be fabricated.

## Product Principles

1. Demonstrate the mechanism — the graph engine routing and verifying agents — visibly, not just in prose.
2. Developer credibility over marketing flourish; correctness of commands and names is sacred.
3. Two entry points, one story: "The CLI bootstraps the project. The Skill builds it."
4. Domain specificity is the moat; every claim traces to a concrete Stellar fact.
5. Premium finish: the site should feel as engineered as the framework it sells.

## Accessibility & Inclusion

Dark, low-glare interface for developer use scenes; WCAG AA contrast, keyboard navigable, reduced-motion support.