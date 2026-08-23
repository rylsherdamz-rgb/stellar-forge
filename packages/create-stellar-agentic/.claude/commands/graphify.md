# /graphify

Build a knowledge graph of the current project or a specific path for navigation and querying.

## Usage
```
/graphify [path] [options]
```
- `path`: defaults to `.` (current project root)
- `options`: `--no-viz`, `--mode deep`, `--update`, `--directed`

## What it does
1. Detects all files in the project
2. Extracts entities and relationships (AST for code, semantic for docs)
3. Builds a knowledge graph with community detection
4. Generates `graphify-out/` with:
   - `graph.html` — interactive visualization
   - `GRAPH_REPORT.md` — audit report with god nodes and surprising connections
   - `graph.json` — raw graph data for queries

## After graphify
You can navigate the project:
- `/graphify query "How do the contracts connect to the frontend?"`
- `/graphify query "What's the payment flow?"`
- `/graphify explain "<node-name>"`

## Integration Points
- Run automatically after `/scaffold` to graph the new project
- Run automatically after `/deploy` to graph the deployed project state
- Run automatically after `/test-e2e` to graph test artifacts
- Part of Phase 0 (self-graphify the framework repo)
- Part of Phase 4.5 (graphify the user's generated project)
