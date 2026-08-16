# Forge Gateway

Stellar context MCP gateway for AI agents — one remote endpoint for docs, skills, playbooks, standards, ecosystem data and community intel, with sandboxed code execution. Modeled on the Stellar Raven architecture.

```
docs · skills · playbooks · standards · ecosystem · intel  ──▶  /mcp  ──▶  your agent
```

## What it is

| Piece | What it does |
|-------|--------------|
| `POST /mcp` | Remote MCP server (streamable HTTP) with 3 tools: `search`, `execute`, `catalog_summary` |
| Catalog | 60+ curated + repo-scanned entries: skills, evals, agents, contract templates, SEP/CAP standards, ecosystem, community intel, playbooks (x402, MPP, token, vault, deploy, zk, e2e, work-graph) |
| `search` | Ranked keyword/natural-language search over the catalog, optional type filter |
| `execute` | Sandboxed JavaScript (`node:vm`, no `require`/`fetch`/`process`/`globalThis`, 2s timeout) — code can call `catalog.get(id)` and `catalog.search(q)` |
| `/playground` | Zero-dependency web UI to search and execute against the live catalog |
| `/health` | Catalog size + uptime |
| `scripts/check-live.mjs` | Daily probes of Soroban RPC, Horizon, npm registry, docs site, GitHub — mirrors Raven's "checked against live services" |

## Run

```bash
npm start                    # http://localhost:8787
PORT=8788 npm start          # custom port
FORGE_GATEWAY_TOKEN=sekret npm start   # require Bearer token on /mcp and /api/execute
```

## Connect an agent

```bash
# Claude Code
claude mcp add --transport http forge-gateway http://localhost:8787/mcp

# Cursor (~/.cursor/mcp.json)
# { "mcpServers": { "forge-gateway": { "url": "http://localhost:8787/mcp" } } }

# Codex
codex mcp add forge-gateway --url "http://localhost:8787/mcp"
```

## Test

```bash
npm test          # 10 tests: catalog, search ranking, sandbox blocking, auth, health
npm run check-live # probes live Stellar services
```

## Notes

- The catalog is rebuilt at startup from the repo (`FORGE_CATALOG_ROOT` overrides the root). Entries merge curated data with scanned `skills/`, `evals/`, `agents/`, `templates/contracts/`, `docs/`.
- The sandbox is best-effort isolation (`node:vm`). For untrusted multi-tenant execution, deploy behind `node --experimental-permission` or an OS-level sandbox; document your deployment mode.
- The MCP route runs on a raw `node:http` server because the SDK transport manages the request stream itself; Express handles `/health`, `/api/*` and `/playground`.