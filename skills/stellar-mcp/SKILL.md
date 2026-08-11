---
name: stellar-mcp
description: >
  MCP (Model Context Protocol) tools for Stellar development. Gives Claude
  direct access to the Stellar blockchain, filesystem, GitHub, and Playwright
  through configured MCP servers. Use when querying chain data, deploying
  contracts, managing repos, or running e2e tests from within the agent.
version: 1.0.0
author: rylsherdamz-rgb
tags:
  - stellar
  - mcp
  - tools
  - rpc
  - blockchain
  - playwright
  - filesystem
requires:
  - stellar-forge
---

# Stellar MCP Tools

Claude has direct access to the Stellar blockchain, filesystem, and GitHub through MCP servers configured in `.mcp.json`.

## Available MCP Servers

### `stellar-rpc`
Direct blockchain queries without leaving the conversation.

```
Tools available:
- get_account(address)       → account balance, sequence, signers
- get_contract_data(id, key)  → contract storage entry
- simulate_transaction(xdr)   → simulate before submitting
- send_transaction(xdr)       → submit signed transaction
- get_events(contractId)      → query contract events
- get_ledger_entries(keys)    → raw ledger entries
```

**Use for:**
- Checking account balances during development
- Verifying contract state after deployment
- Debugging transaction failures with simulation
- Querying contract events without writing frontend code

### `filesystem`
Read and write project files directly.

```
Tools available:
- read_file(path)     → read file contents
- write_file(path)    → write file contents
- list_directory(path) → list files in directory
- search_files(pattern) → search by glob
- get_file_info(path)  → file metadata
```

### `github`
Manage repositories, PRs, issues, and code search.

```
Tools available:
- create_or_update_file  → commit changes
- search_repositories    → find repos
- get_issue             → read issue details
- create_pull_request   → open PRs
- list_issues           → browse open issues
```

### `playwright`
Run browser-based e2e tests for Stellar dApps.

```
Tools available:
- browser_navigate(url)      → open page
- browser_click(selector)    → click element
- browser_type(selector, text) → fill input
- browser_screenshot()       → capture screen
- browser_evaluate(script)   → run JS in page
```

## When to Use MCP vs Agentic Kit

| Task | Use |
|------|-----|
| Query chain data during development | `stellar-rpc` MCP |
| Check contract state after deploy | `stellar-rpc` MCP |
| Read/write project files | `filesystem` MCP |
| Commit and push code | `github` MCP |
| Run e2e tests | `playwright` MCP |
| Production frontend blockchain queries | `useStellarData()` hook |
| Production contract calls from frontend | `useContract().write()` hook |

## Strict Rules
1. Use MCP tools during development and debugging only
2. Production blockchain queries go through `useStellarData()` — not MCP
3. Never commit secrets to `.mcp.json` — use `env` field with user-provided values
4. Use `stellar-rpc` for quick checks; use `useStellarData()` for built frontend code
5. The `filesystem` MCP is the primary way Claude reads/writes project files
