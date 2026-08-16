# Work Graph — Plan, Fan-Out, Merge Reference

How the kernel turns one request into a parallel agent DAG. The kernel writes `data/graphs/<task-slug>.json` (machine-readable, executable) + `data/plans/<task-slug>.md` (human-readable rationale) in Phase 0, batch-spawns each wave in one message, merges state deltas after each wave, and never lets agents touch shared files. **The graph JSON is the source of truth for what to spawn next** — never spawn from prose.

## 1. Graph File — `data/graphs/<task-slug>.json`

```json
{
  "task": "x402-api", "status": "planned",
  "waves": [{"wave": 1, "mode": "parallel", "nodes": ["contracts", "frontend", "payments"]},
            {"wave": 2, "mode": "parallel", "nodes": ["backend"]}],
  "nodes": {
    "contracts": {"agent": "stellar-contracts", "status": "pending", "retries": 0,
                  "paths": ["contracts/"], "verifier": "evals/01-contract-eval.md",
                  "contract": "emit NEXT_PUBLIC_TOKEN_CONTRACT_ID", "delta": {}},
    "frontend":  {"agent": "stellar-frontend",  "status": "pending", "retries": 0,
                  "paths": ["frontend/"],  "verifier": "evals/02-frontend-eval.md",
                  "contract": "emit endpoint shape list", "delta": {}},
    "payments":  {"agent": "stellar-payments",  "status": "pending", "retries": 0,
                  "paths": ["backend/src/middleware/"], "verifier": "evals/03-backend-eval.md",
                  "contract": "emit middleware path + USDC addr", "delta": {}}
  },
  "edges": [
    {"from": "contracts", "to": "frontend", "type": "sequential", "data": "contract IDs"},
    {"from": "frontend",  "to": "backend",  "type": "parallel",   "data": "API requirements"},
    {"from": "payments",  "to": "backend",  "type": "sequential", "data": "middleware path"}
  ]
}
```

**Execution loop**: read graph → batch-spawn all `pending` nodes of the current wave (mark `running` first) → fan-in → mark `verified`/`failed`, apply deltas → next wave → mark graph `complete`.

Status lifecycle: `pending → running → verified → complete`; failures go `failed → retry (retries+1) → running` or `failed → rerouted (agent changed) → running`. Max 3 retries per node; never re-run a whole wave because one node failed — re-spawn only the failed node.

## 2. Plan Manifest — `data/plans/<task-slug>.md`

The human-readable rationale backing the graph (see below). Written in Phase 0, read alongside the graph.

```markdown
# Work Graph: <task-slug>
Task: <one-line user intent>
Date: <date>

## Nodes
| Node | Slice | Owned paths | Interface contract (emit) |
|------|-------|-------------|---------------------------|
| @stellar-contracts | <slice> | contracts/ | `NEXT_PUBLIC_*_CONTRACT_ID` values |
| @stellar-frontend  | <slice> | frontend/   | endpoint shape list |
| @stellar-backend   | <slice> | backend/    | route manifest |
| @stellar-payments  | <slice> | backend/src/middleware/ | middleware path + USDC addr |

## Edges
| From | To | Type | Data passed |
|------|----|------|-------------|
| contracts | frontend | sequential | contract IDs (kernel applies to .env) |
| frontend  | backend  | parallel | API requirements |
| payments  | backend  | sequential | middleware path |

## Waves
- Wave 1 (parallel): contracts ∥ frontend ∥ payments
- Wave 2 (parallel): backend (needs Wave 1 contracts + payments + frontend)

## Merge (kernel-only)
- `.env` keys: <list of keys each node reports; kernel merges after fan-in>
- `data/deployments/`: <networks + contract IDs to append>
```

## 3. Batch-Spawn — One Message per Wave

Parallelism comes from launching every node of a wave as Task calls in the SAME message. Sequential spawns (one Task per turn) are the #1 reason fan-out degenerates into serial execution.

```text
Wave 1 — ALL of these in one message:
  Task A: subagent_type=general | prompt="You are @stellar-contracts. Intent: <slice>. 
           Owned paths: <paths>. Emit: <interface contract>. Verifier: evals/01-contract-eval.md. 
           Return: OUTPUT files | STATE DELTA | VERIFIER result."
  Task B: subagent_type=general | prompt="You are @stellar-frontend. Intent: <slice>.
           Owned paths: <paths>. Emit: <interface contract>. Verifier: evals/02-frontend-eval.md.
           Return: OUTPUT files | STATE DELTA | VERIFIER result."
  Task C: ... (one per node in the wave)
```

Wait for all wave results (fan-in), apply state deltas to shared state, then batch-spawn Wave 2 the same way.

## 4. Fan-in Merge Rules

| Item | Who writes it | Why |
|------|---------------|-----|
| Project source files (owned paths) | The owning agent | disjoint paths = no conflict |
| `.env` / `.env.local` | Kernel only | two concurrent editors clobber each other |
| `data/deployments/*.json` | Kernel only | append-after-fan-in, never during |
| `data/logs/*.md` | Each agent appends its own | append-only, no shared file |
| `data/projects/<name>.md` | Kernel | synthesis step |

Interface contracts exist so downstream waves never block on upstream *values* they don't actually need — only on the artifacts named in the manifest (e.g., frontend needs contract IDs; backend only needs the frontend's endpoint shape list, which frontend emits in its delta even if the UI is unfinished).

## 5. Verify Per Wave (not per node)

1. Wave completes → run each node's verifier from `evals/*.md` against its output
2. All pass → merge deltas → spawn next wave
3. Any fail → retry that node (same prompt + failure detail) → reroute to fallback node → escalate to user (max 3)
4. Final wave → synthesize all verified outputs into the eval report

## 6. Failure Steering

| Failure | Action |
|---------|--------|
| Node output fails its verifier | Retry node with verifier failure detail |
| Retry fails twice more | Reroute its slice to a sibling node (e.g., payments slice → backend) |
| Reroute fails | Escalate to user with partial state preserved in the manifest |

Never re-run a whole wave because one node failed — re-spawn only the failed node and keep its wave siblings' deltas.