# Data Directory

Persistent file-based memory for the Stellar Agentic Framework.

```
data/
├── projects/           # Per-project context files
├── decisions/          # Architecture decisions (ADR format)
├── plans/              # Human-readable work-graph manifests per task
├── graphs/             # Machine-readable DAG state (nodes, edges, waves, status)
└── logs/               # Session activity logs
```

## Plans & Graphs
For every task the kernel writes two files in Phase 0 planning:
- `data/plans/<task-slug>.md` — human-readable manifest: nodes, owned paths, interface contracts, wave order
- `data/graphs/<task-slug>.json` — executable DAG: node statuses the kernel mutates as waves run

See `references/work-graph.md` for the full protocol. Agents never write these files.

## Projects
Each file in `data/projects/` tracks the state of a scaffolding or deployment:
```
<project-name>.md
  - Created: date
  - Type: full / contract-only / frontend-only / backend-only
  - Contracts deployed: [id, network, date]
  - Frontend URL: <url>
  - Backend URL: <url>
  - Last e2e test: date, result
```

## Decisions
ADR-format files in `data/decisions/`:
```
<date>-<topic>.md
  - Context: why this decision was needed
  - Decision: what was chosen
  - Consequences: trade-offs accepted
```

## Logs
Activity logs in `data/logs/`:
```
<date>.md
  - Sessions: what was done per session
  - Agents used: which agents were spawned
  - Outcomes: pass/fail per phase
  - Blockers: anything blocking progress
```
