# Graphs

Machine-readable work-graph state. One file per task: `<task-slug>.json`.

The kernel (graph engine) writes these in Phase 0 planning and mutates node statuses as waves execute — this file is the source of truth for what to spawn next. Agents never touch these files.

## Status Lifecycle

```
pending → running → verified → complete (all nodes)
                 ↘ failed → retry (retries+1) → running | rerouted (agent changed) → running
```

## Schema

```json
{
  "task": "task-slug",
  "status": "planned | running | complete",
  "waves": [{ "wave": 1, "mode": "parallel", "nodes": ["a", "b"] }],
  "nodes": {
    "<node-id>": {
      "agent": "stellar-<zone>",
      "status": "pending | running | verified | failed | rerouted",
      "retries": 0,
      "paths": ["owned/relative/paths/"],
      "verifier": "evals/<file>.md",
      "contract": "what this node must emit",
      "delta": {}
    }
  },
  "edges": [
    { "from": "a", "to": "b", "type": "parallel | sequential | conditional", "data": "what passes along the edge" }
  ]
}
```

## Rules

- Never spawn from prose — read this graph, execute pending nodes of the current wave, write it back after fan-in
- Nodes within a wave run in parallel (batch-spawned in one message); waves run serially
- Edge `sequential` means downstream node belongs to a later wave; `parallel` means same wave; `conditional` means spawn only after upstream verifies
- On failure: `status: failed`, then `retry` (retries+1) or `rerouted` (agent changed) — max 3 retries per node
- `delta` accumulates the node's state delta after fan-in merge (kernel applies it to `.env`, `data/deployments/`)