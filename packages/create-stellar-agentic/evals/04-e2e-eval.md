[CAPABILITY EVAL: stellar-e2e]
Task: Run end-to-end tests on the generated Stellar dApp including contract deployment, wallet connection, transaction submission, and payment flows.
Success Criteria:
  - [ ] Local Stellar network starts successfully (`stellar container start local`)
  - [ ] Contract deploys to local network without error
  - [ ] Contract functions invoke successfully (read + write)
  - [ ] Frontend wallet connection works (via Playwright)
  - [ ] Transaction simulation succeeds
  - [ ] Transaction submission confirms on-chain
  - [ ] x402 payment flow: 402 → sign auth entries → 200 OK
  - [ ] MPP charge flow: SAC transfer → confirmed on-chain
  - [ ] MPP channel flow: deposit → cumulative commits → close (if implemented)
  - [ ] Contract state matches expectations after all operations
  - [ ] All Playwright tests pass (X passed, 0 failed)
Expected Output: E2E test report with all checks passing, contract IDs recorded, wallet flows verified.

[CAPABILITY EVAL: stellar-agentic-kit]
Task: Verify the Stellar Agentic Kit (x402 + MPP) payment flows end-to-end.
Success Criteria:
  - [ ] x402: server returns 402 with payment requirements
  - [ ] x402: client builds and signs auth entries
  - [ ] x402: facilitator verifies and settles
  - [ ] x402: server returns 200 with resource
  - [ ] MPP Charge: server generates challenge
  - [ ] MPP Charge: client signs and submits SAC transfer
  - [ ] MPP Channel: client creates cumulative commitment signature
  - [ ] MPP Channel: server verifies cumulative commitment
  - [ ] MPP Channel: server closes channel and settles on-chain
Expected Output: Payment flows verified end-to-end with on-chain settlement confirmed.

[CAPABILITY EVAL: graphify-project]
Task: Build a knowledge graph of the generated project.
Success Criteria:
  - [ ] graphify-out/graph.json exists and is non-empty
  - [ ] Graph has nodes for every major module (contracts, frontend, backend)
  - [ ] No dangling or missing edges detected (health check passes)
  - [ ] Community labels are coherent and meaningful
  - [ ] GRAPH_REPORT.md generated with god nodes and surprising connections
Expected Output: graphify-out/ directory with graph.json, graph.html, GRAPH_REPORT.md. Graph health: OK.
