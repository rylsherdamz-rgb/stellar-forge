# Plans

Human-readable work-graph manifests. One file per task: `<task-slug>.md`.

Written by the kernel in Phase 0 planning alongside the machine-readable graph (`data/graphs/<task-slug>.json`). Contains the nodes, owned paths, interface contracts, wave order, and fan-in merge rules — the rationale behind the graph. See `references/work-graph.md` for the full protocol.

Agents never write these files — the kernel does, before any spawn, and reads them back when steering failed nodes.