# /scaffold

Create a new Stellar dApp project from scratch using the framework templates.

## Usage
```
/scaffold <project-name> [type]
```
Types: `full` (default), `contract-only`, `frontend-only`, `backend-only`, `payment-only`, `zk-only`

## Steps
1. Run `mkdir -p <project-name>` and cd into it
2. Determine which templates to copy based on `[type]`
3. Copy from `templates/` to `<project-name>/`:
   - `templates/contracts/` → `<project-name>/contracts/`
   - `templates/frontend/` → `<project-name>/frontend/`
   - `templates/backend/` → `<project-name>/backend/`
   - `templates/cicd/` → `<project-name>/.github/workflows/`
4. Create `<project-name>/package.json` with npm workspaces
5. Create `<project-name>/.env.example` from template
6. Run `cd <project-name> && npm install`
7. Run `cargo init --workspace <project-name>/contracts/` if contracts included
8. Write decision record to `data/decisions/<date>-scaffold-<project-name>.md`
10. Run `/graphify <project-name> --no-viz` to graph the new project
10. Report: "Project <project-name> scaffolded at <path>. Next: run /deploy or /test-e2e"

## Templates Reference
- `templates/contracts/hello-world/` — Minimal contract with constructor, auth, events
- `templates/contracts/token/` — SEP-41 token contract (mint, burn, transfer, approve)
- `templates/frontend/` — Next.js 15 App Router with Stellar Wallets Kit + wallet hooks
- `templates/backend/` — Express server with x402/MPP payment middleware
- `templates/cicd/` — GitHub Actions for contract test, frontend deploy, backend deploy
